import { createReadStream, createWriteStream } from "fs";
import { readdir,open, readFile,rm, rename } from "fs/promises"
import http from "http"
import mime from "mime-types"


// console.log(mime.contentType("hello.txt"));
const server=http.createServer(async(req,res)=>{
    // console.log(req)

    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Headers","*");
    res.setHeader("Access-Control-Allow-Methods","*");
    res.setHeader("Access-Control-Allow-Credentials", "true");


    if (req.method === "OPTIONS") {
    // res.writeHead(204);
    res.end();
    return;
  }

    // console.log(req.method);

    if(req.method==="GET"){
        if(req.url==="/"){
            console.log("Server hitting");
           serveDirectory(req,res);
        }
        else{
            // const readFile=createReadStream(`./storage/${req.url}`);
            // readFile.pipe(res);
            try{
                const [url,queryString]=req.url.split("?");
    
                const queryParam={};
    
                queryString?.split("&").forEach((pair)=>{
                    const [key,value]=pair.split("=");
                    queryParam[key]=value;
                })
    
                // console.log(queryParam);
    
                // console.log(queryParam)
    
                const fileHandle=await open(`./storage${url}`);
                const stats=await fileHandle.stat();
                if(stats.isDirectory()){
                    serveDirectory(req,res);
                }
                else{
                    
                    const readStream=fileHandle.createReadStream();
                    
                    // console.log(url);
                    res.setHeader("Content-Type",mime.contentType(url.slice(1)));
                    // console.log(url,mime.contentType(url.slice(1)));
                    if(mime.contentType(url.slice(1))==="application/mp4"){
                        res.setHeader("Content-Type","video/mp4");
                    }
                    else if(mime.contentType(url.slice(1))==="application/vnd.openxmlformats-officedocument.wordprocessingml.document"){
                        res.setHeader("Content-Type","application/text");
                    }
                    res.setHeader("Content-Length",stats.size)
                    if(queryParam?.action==="download"){
                        // console.log("Hello, setting download header");
                        res.setHeader("Content-Disposition",`attachment; filename=${url.slice(1)}`)
                    }
                    readStream.pipe(res);
                }
                
            }catch(e){
                // console.log(e.message);
                res.end("Not found");
            }
            
        } 
    }
    else if(req.method==="OPTIONS"){
        res.end("OK");
    }
    else if(req.method==="POST"){
        const writeStream=createWriteStream(`./storage/${req.headers.filename}`);
        var totalChunks=0;
        req.on("data",(chunk)=>{
            // console.log("File uploading");
            totalChunks++;
            writeStream.write(chunk);
        })
        req.on("end",()=>{
            // console.log(totalChunks); // If you write it before then it will display only the initial value
            writeStream.end();
            res.end(JSON.stringify({data:"File uploaded on server"}));
        })
    }
    else if(req.method==="DELETE"){
        console.log(req.headers.file);
        try{
            const fileName=req.headers.file;
            await rm(`./storage/${fileName}`);
            res.end(JSON.stringify({message:`File ${fileName} Deleted successfully`}));
        }
        catch(err){
            res.end(JSON.stringify({message:err.message}));
        }
        
    }
    else if(req.method==="PATCH"){
        try{
            req.on("data",async (chunk)=>{
                const data=JSON.parse(chunk.toString());
                // console.log(data);
                await rename(`./storage/${data.oldFilename}`,`./storage/${data.updatedFileName}`)
                res.end("File renamed successfully");
            })
        }
        catch(err){
            res.end(err.message);
        }

    }
    
    
})


async function serveDirectory(req,res){
    const [url,queryString]=req.url.split("?"); // Used to separate query params from the actual URL.
    const itemsList=await readdir(`./storage${url}`); // It gives all the files and folder that are there in storage folder.
    res.end(JSON.stringify(itemsList));  // Here we cannot directly send the itemsList object, we can either put a string or a buffer. Hence we are using JSON.stringify function on it,
}

const PORT = process.env.PORT || 80;

server.listen(PORT,"0.0.0.0",()=>{
    console.log("Server started");
})