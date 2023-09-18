import { createCors, error, json, RequestLike, Router } from 'itty-router'
import token from "../config.json"

const baseurl = 'https://discord.com/api/v10/users/'
const { preflight, corsify } = createCors({
    methods: ['GET', 'PATCH', 'POST'],
    origins: ['http://localhost:3001'],
})

const router = Router()

function fetchData(id:string) {
    const url = baseurl + id;
    const headers = {
        "Authorization": `Bot ${token.token}`,
    };

    return fetch(url, {
        method: 'GET',
        headers: headers,
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    });
}

router
    .all('*', preflight)
    .get('/v1/:id/default.json', (handler) => {
            return fetchData(handler.params.id)
    })
export default {
    port: 3001,
    fetch: (request: RequestLike) => router
        .handle(request)
        .then(json)
        .catch(error)
        .then(corsify)
}