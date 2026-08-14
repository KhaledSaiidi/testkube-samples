GET {{origin}}/healthz
HTTP 200
[Asserts]
jsonpath "$.status" == "ok"

GET {{origin}}/readyz
HTTP 200
[Asserts]
jsonpath "$.status" == "ready"

GET {{origin}}/api/hello
HTTP 200
[Asserts]
jsonpath "$.message" == "hello, world"

GET {{origin}}/api/hello-pg
HTTP 200
[Asserts]
jsonpath "$.message" == "hello world from postgres"
