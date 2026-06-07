import urllib.request
import urllib.parse
import concurrent.futures
import time
import os
import sys

try:
    import fitz
except ImportError:
    print("Please run this script inside a Python environment where PyMuPDF is installed.")
    sys.exit(1)

def create_dummy_pdf():
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((100, 100), "Hello FieldFlow", fontsize=12)
    pdf_bytes = doc.write()
    doc.close()
    return pdf_bytes

def send_request(pdf_bytes, req_id):
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    parts = []
    parts.append(f"--{boundary}")
    parts.append('Content-Disposition: form-data; name="file"; filename="test.pdf"')
    parts.append('Content-Type: application/pdf')
    parts.append('')
    parts.append(pdf_bytes)
    parts.append(f"--{boundary}--")
    parts.append('')
    
    body_parts = []
    for part in parts:
        if isinstance(part, str):
            body_parts.append(part.encode('utf-8'))
        else:
            body_parts.append(part)
    body = b'\r\n'.join(body_parts)
    
    url = "http://127.0.0.1:8000/api/pdf/extract"
    req = urllib.request.Request(url, data=body)
    req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')
    req.add_header('Content-Length', str(len(body)))
    
    start_time = time.time()
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            status = response.status
            response.read()
            duration = time.time() - start_time
            return req_id, status, duration, None
    except Exception as e:
        duration = time.time() - start_time
        return req_id, None, duration, str(e)

def main():
    print("Generating mock PDF...")
    pdf_bytes = create_dummy_pdf()
    
    num_requests = 1000
    max_workers = 100
    
    print(f"Sending {num_requests} concurrent requests to backend...")
    start_time = time.time()
    
    success_count = 0
    failure_count = 0
    failures = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(send_request, pdf_bytes, i): i for i in range(num_requests)}
        for future in concurrent.futures.as_completed(futures):
            req_id, status, duration, error = future.result()
            if status == 200:
                success_count += 1
            else:
                failure_count += 1
                failures.append((req_id, status, error))
            
            completed = success_count + failure_count
            if completed % 100 == 0:
                print(f"Completed {completed}/{num_requests} requests...")
                
    total_time = time.time() - start_time
    print("\n--- Stress Test Results ---")
    print(f"Total Requests: {num_requests}")
    print(f"Success Count:  {success_count}")
    print(f"Failure Count:  {failure_count}")
    print(f"Total Duration: {total_time:.2f} seconds")
    print(f"Average Rate:   {num_requests / total_time:.2f} req/sec")
    
    if failures:
        print("\nFirst 10 Failures:")
        for req_id, status, error in failures[:10]:
            print(f"Request #{req_id}: Status {status}, Error: {error}")
            
    if success_count == num_requests:
        print("\nSUCCESS: All 1,000 files processed successfully without crashing the server!")
    else:
        print(f"\nFAILURE: {failure_count} requests failed.")

if __name__ == "__main__":
    main()
