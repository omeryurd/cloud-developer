import 'source-map-support/register'
import middy from "@middy/core"
import cors from "@middy/http-cors"
import httpErrorHandler from '@middy/http-error-handler'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { requestUploadURL } from '../../businessLogic/todos'
import { getUserId } from '../utils'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId;
    const userId = getUserId(event);
    // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
    try {
      const response = await requestUploadURL(userId, todoId)
      return {
        statusCode: response.httpCode,
        body: JSON.stringify({
          uploadUrl: response.uploadUrl
        })
      }
    } catch (error) {
      return {
        statusCode: error.statusCode,
        body: JSON.stringify(error.statusCode)
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
