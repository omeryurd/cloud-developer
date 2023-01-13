import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
//import * as middy from 'middy'
import middy from "@middy/core"
import cors from "@middy/http-cors"
import { v4 as uuidV4 } from 'uuid';
import { DynamoDB } from "@aws-sdk/client-dynamodb";
//import { cors } from 'middy/middlewares'
//import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils';
//import { createTodo } from '../../businessLogic/todos'
import { TodoItem } from '../../models/TodoItem';
const docClient:DynamoDB = new DynamoDB({});
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Processing event: ', event)
    const todoId = uuidV4()
  
    const parsedBody = JSON.parse(event.body)
  
    const newItem: TodoItem = {
      userId: getUserId(event),
      id: todoId,
      createdAt: new Date().toISOString(),
      ...parsedBody,
      done: false,
      
    }
    await docClient.putItem({TableName:process.env.TODOS_TABLE, Item:newItem as any});

    return {
      statusCode: 201,
      body: JSON.stringify({
        item: newItem
      })
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)
