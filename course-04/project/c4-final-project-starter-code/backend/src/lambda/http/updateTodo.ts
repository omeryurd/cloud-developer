import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import middy from "@middy/core"
import cors from "@middy/http-cors"
import httpErrorHandler from '@middy/http-error-handler'
//import { updateTodo } from '../../businessLogic/todos'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { getUserId } from '../utils'
const docClient:DynamoDBClient = new DynamoDBClient({region: process.env.REGION});
const dynamo = DynamoDBDocumentClient.from(docClient);
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId;
    const updatedTodo: UpdateTodoRequest = JSON.parse(event.body);
    const userId = getUserId(event);
    try {
      const response = await dynamo.send(new UpdateCommand({
        TableName: process.env.TODOS_TABLE,
        Key: {todoId, userId},
        UpdateExpression:"set #name = :name, #dueDate=:dueDate, done=:done",
        ConditionExpression:"userId = :userId",
        ExpressionAttributeNames:{
          "#name":"name",
          "#dueDate":"dueDate"
        },
        ExpressionAttributeValues: {
          ":userId": userId,
          ":name": updatedTodo.name,
          ":dueDate": updatedTodo.dueDate,
          ":done": updatedTodo.done
        }
        
      }))
      return {
        statusCode: response.$metadata.httpStatusCode,
        body: JSON.stringify(updatedTodo)
      }
    } catch (error) {
      console.error(error);
      return {
        statusCode: 502,
        body: JSON.stringify(error.name)
      }
    }


  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
