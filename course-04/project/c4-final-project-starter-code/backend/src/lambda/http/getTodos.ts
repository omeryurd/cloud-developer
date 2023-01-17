import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import middy from "@middy/core"
import cors from "@middy/http-cors"

//import { getTodosForUser as getTodosForUser } from '../../businessLogic/todos'
import { getUserId } from '../utils';
const docClient:DynamoDBClient = new DynamoDBClient({region: process.env.REGION});
const dynamo = DynamoDBDocumentClient.from(docClient);
// TODO: Get all TODO items for a current user
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const userId = getUserId(event);
    let statusCode = 201;
    try {
      const todos = await dynamo.send(new QueryCommand({
        TableName: process.env.TODOS_TABLE,
        IndexName: process.env.TODOS_CREATED_AT_INDEX,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId as any}
      }))
      const items = todos.Items;
      statusCode = todos.$metadata.httpStatusCode
      return {
        statusCode: statusCode,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          items
        })
      }
    } catch (error) {
      console.error(error)
      
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: "Error occured!"
      }
    }


  }
)
handler.use(
  cors({
    credentials: true
  })
)
