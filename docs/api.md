# API Schema

GET `/pantry-items`
  Return list of items
  
POST `/pantry-items`
  Create new pantry-items (list input)
  
PUT `/pantry-items/{id}`
  Update items (name, expiry dates)
  
DELETE `/pantry-items/{id}`
  Delete an item (mark it deletedAt = now)
  
POST `/receipt`
  Upload a image to process
  Return list of items (parsed result)
  
GET `/recipes?i=`
  Return recipes matched selected ingredients
  Inputs: i: list of ingredients
  Outputs: list of recipes
  
POST `/recipes`
  Input: ingredient list
  Generate recipes (save generated ones to db)
  Returns matched and generated recipes as list
  
GET `/recipes/{id}`
  Return details of a recipe
  
POST `/recipes/{id}/save`
  Save a recipe to user's collection
