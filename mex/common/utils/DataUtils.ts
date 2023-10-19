function hasAnyChildWithInvalidData(dataContext:any):boolean {

    for (const property in dataContext) {
        let object = dataContext[property]
        
        if (Array.isArray(object) && object.length > 0) {

            let hasInvalidItem = object.filter(item => item.__typename && item.__invalid).length > 0

            if (hasInvalidItem) {
                return true
            }
        }

        else if (object?.__typename && object?.__invalid) {
            return true;
        }
    }

    return false
}


export default {
    hasAnyChildWithInvalidData
}
