import 'source-map-support/register'
import xray from "aws-xray-sdk-core"
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import middy from "@middy/core"
import cors from "@middy/http-cors"
import httpErrorHandler from '@middy/http-error-handler'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import {GetObjectCommand, S3} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidV4 } from 'uuid';
//import { createAttachmentPresignedUrl } from '../../businessLogic/todos'
import { getUserId } from '../utils'
const s3 = xray.captureAWSv3Client(new S3({}));
const docClient:DynamoDB = xray.captureAWSv3Client(new DynamoDB({region:"us-west-1"}));
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId;
    const urlId = uuidV4()
    const userId = getUserId(event);
    // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
    const uploadUrl = await getSignedUrl(s3,new GetObjectCommand(
        {Bucket:process.env.ATTACHMENT_S3_BUCKET, Key:urlId}),
        {expiresIn: Number(process.env.SIGNED_URL_EXPIRATION)}
        )
    let statusCode = 200;

    try {
      const response = await docClient.updateItem({
        TableName: process.env.TODOS_TABLE,
        Key: todoId as any,
        UpdateExpression: 'set #attachmentUrl = :attachmentUrl',
        ExpressionAttributeValues: {
          ":attachmentUrl": {"S":uploadUrl},
          ":userId": {"S":userId},
        },
        ConditionExpression:"userId = :userId",
        ExpressionAttributeNames:{
          "#attachmentUrl":"attachmentUrl",
        }
        
      })
      statusCode = response.$metadata.httpStatusCode
    } catch (error) {
      console.log(error);
    }
    return {
      statusCode: statusCode,
      body: JSON.stringify({
        uploadUrl
      })
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
