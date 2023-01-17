import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
//import * as middy from 'middy'
import middy from "@middy/core"
import cors from "@middy/http-cors"
import { v4 as uuidV4 } from 'uuid';
import { DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
//import { cors } from 'middy/middlewares'
//import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils';
//import { createTodo } from '../../businessLogic/todos'
import { TodoItem } from '../../models/TodoItem';
const docClient:DynamoDBClient = new DynamoDBClient({region: process.env.REGION});
const dynamo = DynamoDBDocumentClient.from(docClient);
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Processing event: ', event)
    console.log("REGION: ", process.env.REGION)
    const todoId = uuidV4()
    const parsedBody = JSON.parse(event.body)
    let statusCode = 201;
    const newItem: TodoItem = {
      userId: getUserId(event),
      todoId: todoId,
      createdAt: new Date().toISOString(),
      ...parsedBody,
      done: false,
      
    }
    try {
      const response = await dynamo.send(new PutCommand( {TableName:process.env.TODOS_TABLE, Item:newItem as any}));
      statusCode = response.$metadata.httpStatusCode;
    } catch (error) {
      console.log(error)
    }

    return {
      statusCode: statusCode,
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
