import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import middy from "@middy/core"
import cors from "@middy/http-cors"
import httpErrorHandler from '@middy/http-error-handler'
import { updateTodoItem } from '../../businessLogic/todos'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { getUserId } from '../utils'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId;
    const updatedTodo: UpdateTodoRequest = JSON.parse(event.body);
    const userId = getUserId(event);
    try {
      const response = await updateTodoItem(userId, updatedTodo,todoId);
      return {
        statusCode: response.httpCode,
        body: JSON.stringify({
          item: response.updatedTodo
        })
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
