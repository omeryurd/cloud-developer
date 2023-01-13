import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import middy from "@middy/core"
import cors from "@middy/http-cors"

//import { getTodosForUser as getTodosForUser } from '../../businessLogic/todos'
import { getUserId } from '../utils';
const docClient:DynamoDB = new DynamoDB({region:"us-west-1"});
// TODO: Get all TODO items for a current user
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const userId = getUserId(event);
    const todos = await docClient.query({
      TableName: process.env.TODOS_TABLE,
      IndexName: process.env.xTODOS_CREATED_AT_INDEX,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId as any}
    })
    const items = todos.Items

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        items
      })
    }
  }
)
handler.use(
  cors({
    credentials: true
  })
)
