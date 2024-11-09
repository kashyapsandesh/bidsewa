# Initiallized Bidsewa

## Project Setup with Typescript Node Express

Step1: Create a new folder, In my case "bidsewa".

Step2: Open that folder with vs code.

Step3:npm init -y

Step4:npm i typescript --save-dev(we need typescript till development only)

Step5: initiallized project with typescript (npx tsc init)

Step6:npm in @types/node --save-dev

Step7: Install dependencies
npm i express nodemon
npm install @types/express @types/nodemon --save-dev

Step 7:Typescript directly can't be compiled and run for this we need to first compile ts code to js. For this we have amazing library/dependency called ts node.
npm i ts-node nodemon --save-dev(this are only use as dev dependencies)

Step8:Nodemon configuration
create a nodemon.json file in root
{
"watch":["src"],
"ext":".js, .ts",
"exec":npx ts-node ./src/index.ts
}
Step 9:in package.json
"scripts":{
"start":"npx nodemon"
}
Step10: Make a src directory

Step11: Inside src directory create a file called index.ts

Step 12: Inside index.ts
import express from "express";
const app=express()
app.listen(3000,()=>{
console.log(`server working`)
})

Step 13: Run the basic setup server with
npm start

Step 14:
"typeRoots": [
"./src/types",
"./node_modules/@types"
]
"outDir": "./build"


# Prisma
Install Prisma package and prisma client:
 npm i prisma @prisma/client


 Initiallized Prisma:npx prisma init


 # Change Database from .env file by default postgresql is made:
 default:DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"


 After changing to mysql:DATABASE_URL="mysql://root:@localhost:3306/bidsewa?schema=public"

# Migrate schema in database using the command 
npx prisma migrate dev --name init

# gitlab
