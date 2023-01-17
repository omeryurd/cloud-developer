import 'source-map-support/register'
import xray from "aws-xray-sdk-core"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand
} from "@aws-sdk/lib-dynamodb";
import middy from "@middy/core"
import cors from "@middy/http-cors"
import httpErrorHandler from '@middy/http-error-handler'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import {PutObjectCommand, S3} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
//import { createAttachmentPresignedUrl } from '../../businessLogic/todos'
import { getUserId } from '../utils'
const s3 = xray.captureAWSv3Client(new S3({}));
const docClient:DynamoDBClient =  xray.captureAWSv3Client(new DynamoDBClient({region: process.env.REGION}));
const dynamo = DynamoDBDocumentClient.from(docClient);
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId;
    const userId = getUserId(event);
    // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
    const uploadUrl = await getSignedUrl(s3,new PutObjectCommand(
        {Bucket:process.env.ATTACHMENT_S3_BUCKET, Key:todoId}),
        {expiresIn: Number(process.env.SIGNED_URL_EXPIRATION)}
        )
    const attachmentUrl =`https://${process.env.ATTACHMENT_S3_BUCKET}.s3.amazonaws.com/${todoId}`; 
    try {
      const response = await dynamo.send(new UpdateCommand({
        TableName: process.env.TODOS_TABLE,
        Key: {todoId, userId},
        UpdateExpression:"set #attachmentUrl = :attachmentUrl",
        ConditionExpression:"userId = :userId",
        ExpressionAttributeNames:{
          "#attachmentUrl":"attachmentUrl",
        },
        ExpressionAttributeValues: {
          ":userId": userId,
          ":attachmentUrl": attachmentUrl
        }
        
      }))
      return {
        statusCode: response.$metadata.httpStatusCode,
        body: JSON.stringify({
          uploadUrl: uploadUrl
        })
      }
    } catch (error) {
      console.log(error);
      return {
        statusCode: error.$metadata.httpStatusCode,
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
