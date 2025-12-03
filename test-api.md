GET all todos
    curl -X GET http://localhost:3000/api/todos

create new task
    curl -X POST http://localhost:3000/api/todos \
      -H "Content-Type: application/json" \
      -d '{ "title": "Запланировать демо" }'

Update current 
   curl -X PATCH http://localhost:3000/api/todos/1 \
     -H "Content-Type: application/json" \
     -d '{ "completed": true }'

Delete task
   curl -X DELETE http://localhost:3000/api/todos/1



