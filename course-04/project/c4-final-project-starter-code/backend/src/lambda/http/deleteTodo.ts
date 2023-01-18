import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import middy from "@middy/core"
import cors from "@middy/http-cors"
import httpErrorHandler from '@middy/http-error-handler'

import { deleteTodoItem } from '../../businessLogic/todos'
import { getUserId } from '../utils'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event);
    try {
      const response = await deleteTodoItem(userId,todoId);
      return {
        statusCode: response.httpCode,
        body: JSON.stringify(`item ${todoId} deleted.`)
      }
    } catch (error) {
      return {
        statusCode: error.httpCode,
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
