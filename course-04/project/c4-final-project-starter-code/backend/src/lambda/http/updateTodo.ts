import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import middy from "@middy/core"
import cors from "@middy/http-cors"
import httpErrorHandler from '@middy/http-error-handler'
//import { updateTodo } from '../../businessLogic/todos'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { getUserId } from '../utils'
const docClient:DynamoDB = new DynamoDB({region:"us-west-1"});
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId;
    const updatedTodo: UpdateTodoRequest = JSON.parse(event.body);
    const userId = getUserId(event);
    let statusCode = 200;
    try {
      const response = await docClient.updateItem({
        TableName: process.env.TODOS_TABLE,
        Key: todoId as any,
        UpdateExpression:"SET #name=:name, #dueDate=:dueDate, done=:done",
        ConditionExpression:"userId = :userId",
        ExpressionAttributeNames:{
          "#name":"name",
          "#dueDate":"dueDate"
        },
        ExpressionAttributeValues: {
          ":userId": {"S":userId},
          ":name": {"S":updatedTodo.name},
          ":dueDate": {"S":updatedTodo.dueDate},
          ":done": {"N":updatedTodo.done as any}
        }
        
      })
      statusCode = response.$metadata.httpStatusCode
    } catch (error) {
      console.log(error);
    }

    return {
      statusCode: 200,
      body: JSON.stringify(updatedTodo)
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
