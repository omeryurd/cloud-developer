import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import middy from "@middy/core"
import cors from "@middy/http-cors"

import {  getTodosByUserPaginated } from '../../businessLogic/todos'
import { getUserId } from '../utils';

// TODO: Get all TODO items for a current user
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const userId = getUserId(event);
    const response = await getTodosByUserPaginated(userId);
    return {
      statusCode: response.httpCode,
      body: JSON.stringify({
        items: response.items
      })
    }
/*      try {
      const response = await getTodosByUser(userId);
      return {
        statusCode: response.httpCode,
        body: JSON.stringify({
          items: response.items
        })
      }
    } catch (error) {
      return {
        statusCode: error.httpCode,
        body: JSON.stringify(error.name)
      }
    }  */


  }
)
handler.use(
  cors({
    credentials: true
  })
)
