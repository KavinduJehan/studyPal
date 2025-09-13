StudyPal Tasks Postman collection

Quick start

1. Open Postman and import the collection file `StudyPal Tasks.postman_collection.json` from this folder.
2. In Postman, open the collection and set environment variables if needed:
   - baseUrl (default: http://localhost:8080)
   - userId (default: test-user-1)
3. Run requests in this order for best results:
   - Create example task (creates `lastTaskId` environment variable)
   - Bulk mark complete (uses `lastTaskId`)
   - Get overdue tasks
   - Get tasks sorted by priority
   - Search tasks
   - Get stats
   - Manual rollover trigger

Notes and caveats

- The API exposes `/api/tasks/user/{userId}/overdue` but there is no explicit `/upcoming` endpoint in the controller. The collection uses a create task with a near-future deadline to test "upcoming" behavior locally.
- Rollover is provided as a manual endpoint `/api/tasks/user/{userId}/rollover` you can call to simulate midnight rollover. In production, schedule automatic rollover at midnight on the server side.
- Tests in the collection perform basic assertions (status codes, array shapes, simple field checks). For edge-case tests (timezones, fixed deadlines, partial bulk updates), run targeted requests and review responses manually.

If you want, I can add a small Newman script to run the collection from the command line and produce a report.
 
Additional tests in the collection

- Validation and error tests:
   - "Create invalid task (expect 400)" — sends an invalid payload and asserts a 400 response with error details.
   - "Create missing required fields (expect 400)" — sends empty payload and checks for required-field messages.
   - "Get non-existent task (expect 404)" — queries a hard-coded non-existent id to validate 404 handling.
   - "Actuator health" — checks `/actuator/health` returns status and details.

Simulating database errors

- Stop MongoDB (or point `spring.data.mongodb.host` to a non-existent host) and restart the app. Requests should fail and the global exception handler will return 500 with standardized error.
- Example: to run without MongoDB locally, stop the MongoDB service and then call Create Task — expect a 500 with standardized error body.

Checking logs

- When running the app locally (`mvn spring-boot:run`), logs are printed to the console. Look for INFO and ERROR messages from `TaskService` and `TaskController`.
- For production-like logging, configure `logging.file.name` in `application.properties` to write logs to a file.

Want me to add a Newman run script or CI job that runs this collection and fails the build on errors? I can add it next.
