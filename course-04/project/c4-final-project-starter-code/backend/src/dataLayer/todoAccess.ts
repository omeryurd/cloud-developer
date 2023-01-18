import { DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand
} from "@aws-sdk/lib-dynamodb";
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import xray from "aws-xray-sdk-core"
import {PutObjectCommand, S3} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
const s3 = xray.captureAWSv3Client(new S3({}));
const docClient:DynamoDBClient = xray.captureAWSv3Client(new DynamoDBClient({region: process.env.REGION}));
const dynamo = DynamoDBDocumentClient.from(docClient);
const tableName = process.env.TODOS_TABLE;

export async function putItemToDb(item: any) {
    console.log("Item to be added: ", item)
    return await dynamo.send(new PutCommand( {TableName:tableName, Item:item as any}));
}

export async function getTodosByUserFromDb(userId: string){
    return await dynamo.send(new QueryCommand({
          TableName: tableName,
          IndexName: process.env.TODOS_CREATED_AT_INDEX,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': userId as any}
        }))

}

export async function sendUpdateRequestToDB(userId: string, updatedTodo: UpdateTodoRequest, todoId: string) {
    return await dynamo.send(new UpdateCommand({
        TableName: process.env.TODOS_TABLE,
        Key: {todoId, userId},
        UpdateExpression:"set #name = :name, #dueDate=:dueDate, done=:done",
        ConditionExpression:"userId = :userId",
        ExpressionAttributeNames:{
          "#name":"name",
          "#dueDate":"dueDate"
        },
        ExpressionAttributeValues: {
          ":userId": userId,
          ":name": updatedTodo.name,
          ":dueDate": updatedTodo.dueDate,
          ":done": updatedTodo.done
        }
        
      }))
}

export async function sendDeleteRequestToDB(userId: string, todoId: string) {
    return await dynamo.send(new DeleteCommand({
        TableName: process.env.TODOS_TABLE,
        Key: {todoId, userId},
        ConditionExpression:"userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId
        } 
      }))
}

export async function getSignedURL(todoId: string) {
  const uploadUrl = await getSignedUrl(s3,new PutObjectCommand(
    {Bucket:process.env.ATTACHMENT_S3_BUCKET, Key:todoId}),
    {expiresIn: Number(process.env.SIGNED_URL_EXPIRATION)}
    )

    return uploadUrl;
}

export async function updateAttachment(todoId: string, userId: string) {
  const attachmentUrl =`https://${process.env.ATTACHMENT_S3_BUCKET}.s3.amazonaws.com/${todoId}`; 
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
  return response
}

// From https://rdavis.io/articles/large-dynamodb-queries
export async function * queryGenerator (userId: string) {

    let LastEvaluatedKey;

    do {

        const command = new QueryCommand({
          TableName: tableName,
          IndexName: process.env.TODOS_CREATED_AT_INDEX,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': userId as any},
          Limit: 50,
          ExclusiveStartKey: LastEvaluatedKey
        })

        const response = await dynamo.send(command)
        LastEvaluatedKey = response.LastEvaluatedKey

        const items = response.Items
        yield items

    } while (LastEvaluatedKey)

}


