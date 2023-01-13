import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import middy from "@middy/core"
import cors from "@middy/http-cors"
import httpErrorHandler from '@middy/http-error-handler'

//import { deleteTodo } from '../../businessLogic/todos'
import { getUserId } from '../utils'
const docClient:DynamoDB = new DynamoDB({region:"us-west-1"});
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event);
    let statusCode = 200;
    try{
        const deletedItem = await docClient.deleteItem({
        TableName: process.env.TODOS_TABLE,
        Key: todoId as any,
        ConditionExpression:"userId = :userId",
        ExpressionAttributeValues: {":userId": {"S":userId}}
      })
      statusCode = deletedItem.$metadata.httpStatusCode;
    }catch(e){
      console.log(e);
    }
    
    return {
      statusCode: statusCode,
      body: ''
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
