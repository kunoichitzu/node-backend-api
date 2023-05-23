
const PORT = process.env.PORT || 8000
const express = require('express')
const cors = require('cors')
const app = express()
app.set('port',process.env.PORT || 8000)
app.use(express.json())
app.use(cors())

const API_KEY='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'
const API_GPT='https://api.openai.com/v1/chat/completions'
const PROMPT_GPT='Actúa como un Asistente de HelpDesk que ' +
    'elabora un Ticket de HelpDesk compueto ' +
    'por 3 datos, solicitados al cliente, la IP del local, el Local y la descripción del incidente. ' +
    'respondiendo con el siguiente JSON { response : String , ticket : { ip: String, local: String, descripcion: }}'
const API_GLPI='http://20.232.159.226/apirest.php/Ticket'

const API_GLPI_SESSION ='http://20.232.159.226/apirest.php/initSession'

app.post('/completions',  async ( req, res)=>{

    const prompt = {role: "system", content: PROMPT_GPT}
    function createArray() {
        let messagesOfFront=[prompt]

        console.log(typeof req.body)
        console.log(req.body)

        if(Array.isArray(req.body)){
            messagesOfFront = messagesOfFront.concat(req.body)
        }else{
            messagesOfFront.push(req.body)
        }

        console.log(messagesOfFront)
        return messagesOfFront
    }



    const optionsOfGPT = {
        method:'POST',
        headers:{
            'Content-Type':'application/json',
            'Authorization':`Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: createArray(),
            temperature: 0,
            max_tokens: 1000,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            /*[
                {
                    role: "system",
                    content: PROMPT_GPT
                },
                {
                    role:"user",
                    content: req.body.message
                }
            ]*/

        })
    }
    try{
        console.log(req.body.message)
        const response = await fetch(API_GPT, optionsOfGPT)
        const data = await response.json()

        console.log(data)
        console.log(data.choices[0].message.content)

        const rptaOfChat = data.choices[0].message.content

        let start=rptaOfChat.indexOf("{");
        let end  =rptaOfChat.lastIndexOf("}")+1;
        let ticket;
        let objectJson;

        if (start > 0 && end > start){
            ticket = rptaOfChat.slice(start, end)
            objectJson = JSON.parse(ticket)
            data.choices[0].message.content=objectJson.response

            try{
                /*
                const optionSessionGLPI ={
                    method: 'GET',
                    headers:{
                        'App-Token':'ookjrNZpa0VcEJ0dFksU5ulST1CKJDg2gK5PJSmz',
                        'Content-Type':'application/json',
                        'Authorization':'Basic Z2xwaTpnbHBp'
                    },
                    params:{}
                }
                const responseSessionGLPI = await fetch(API_GLPI_SESSION,optionSessionGLPI)

                const session = await responseSessionGLPI.json()
                console.log(session)

                 */

                const optionsOfGLPI= {
                    method: 'POST',
                    headers: {
                        'App-Token':'ookjrNZpa0VcEJ0dFksU5ulST1CKJDg2gK5PJSmz',
                        'Content-Type':'application/json',
                        'Session-Token':'b8lpahouikrerrva7n8eoti747'
                    },
                    body: JSON.stringify(
                        {input:
                                {
                                    content:  `${objectJson.ticket.descripcion}`,
                                    name:  `Ticket POSU local ${objectJson.ticket.local}`,
                                    _groups_id_requester:  "1",
                                    priority:  "4",
                                    impact:  "3",
                                    urgency:  "2",
                                    status:  "1"
                                }
                        })
                }

                const responseOfGLPI = await fetch(API_GLPI, optionsOfGLPI)

                const responseTicket =  await responseOfGLPI.json()
                console.log(responseTicket)
            }catch (e) {
                console.error("Faltan datos para generar el JSON")
            }
        }

        res.send(data)
        console.log(typeof  rptaOfChat)

    }catch(error){
        console.error(error)
    }
})

app.listen( PORT,() => console.log('Your server is running on PORT'+PORT) )