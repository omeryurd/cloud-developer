import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import middy from "@middy/core"
import cors from "@middy/http-cors"
import httpErrorHandler from '@middy/http-error-handler'

//import { deleteTodo } from '../../businessLogic/todos'
import { getUserId } from '../utils'
const docClient:DynamoDBClient = new DynamoDBClient({region: process.env.REGION});
const dynamo = DynamoDBDocumentClient.from(docClient);
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event);
    console.log("USER ID: ", userId);
    try {
      const deletedItem = await dynamo.send(new DeleteCommand({
        TableName: process.env.TODOS_TABLE,
        Key: {todoId, userId},
        ConditionExpression:"userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId
        } 
      }))
      return {
        statusCode: deletedItem.$metadata.httpStatusCode,
        body: ''
      }
    } catch (e) {
      console.error(e);
      return {
        statusCode: e.$metadata.httpStatusCode,
        body: JSON.stringify(e.name)
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
