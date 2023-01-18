import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { TodoItem } from '../models/TodoItem';
import { v4 as uuidV4 } from 'uuid';
import { 
    putItemToDb,
    getTodosByUserFromDb,
    sendUpdateRequestToDB,
    sendDeleteRequestToDB,getSignedURL, updateAttachment, queryGenerator
} from '../dataLayer/todoAccess';
export async function createTodo(userId: string, todoRequest: CreateTodoRequest){  
    const todoId = uuidV4();
    const newItem: TodoItem = {
      userId: userId,
      todoId: todoId,
      createdAt: new Date().toISOString(),
      ...todoRequest,
      done: false, 
    }

    try {
        const response = await putItemToDb(newItem);
        return {
            httpCode: response.$metadata.httpStatusCode,
            item: newItem
        }
    } catch (error) {
        console.error(error)
        throw {
            name: error.name,
            httpCode: error.$metadata.httpStatusCode,
        }
        

    }

}
export async function getTodosByUser(userId: string){
    try {
        const response = await getTodosByUserFromDb(userId);
        console.log("Todo items returned: ", response.Count)
        return {
            httpCode: response.$metadata.httpStatusCode,
            items: response.Items
        }
    } catch (error) {
        console.error(error)
        throw {
            name: error.name,
            httpCode: error.$metadata.httpStatusCode,
        }
    }
}

export async function getTodosByUserPaginated(userId: string){
    let results = []
    let generator = queryGenerator(userId)
    
        for await (const items of generator) {
            results = results.concat(items)
        }
        return {
            httpCode: 200,
            items: results
        }
 
}


export async function updateTodoItem(userId: string, updatedTodo: UpdateTodoRequest, todoId: string ){
    try {
        const response = await sendUpdateRequestToDB(userId,updatedTodo, todoId);
        console.log("Item updated: ", todoId)
        return {
            httpCode: response.$metadata.httpStatusCode,
            updatedTodo: updatedTodo
        }
    } catch (error) {
        console.error(error)
        throw {
            name: error.name,
            httpCode: error.$metadata.httpStatusCode,
        }
    }
}

export async function deleteTodoItem(userId: string, todoId: string ){

    try {
        const response = await sendDeleteRequestToDB(userId, todoId);
        console.log("Item deleted: ", todoId)
        return {
            httpCode: response.$metadata.httpStatusCode,
        }
    } catch (error) {
        console.error(error)
        throw {
            name: error.name,
            httpCode: error.$metadata.httpStatusCode,
        }
    }
}

export async function requestUploadURL(userId: string, todoId: string ){

    try {
        
        const uploadUrl = await getSignedURL(todoId);
        console.log("URL generated: ", uploadUrl)
        const response = await updateAttachment(todoId, userId)
        return {
            httpCode: response.$metadata.httpStatusCode,
            uploadUrl: uploadUrl 
        }
    } catch (error) {
        console.error(error)
        throw {
            name: error.name,
            httpCode: error.$metadata.httpStatusCode,
        }
    }
}