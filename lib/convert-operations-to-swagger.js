var getDefaultOp = module.exports = function (res, operation) {
    return {
        tags: [res.type],
        parameters: [],
        description: getDescByTypeAndOperation(res.type, operation),
        responses: getRespByTypeAndOperation(res.type, operation)
    }
}

function getDescByTypeAndOperation(resource, operation) {
    switch (operation) {
        case 'create': return 'Insere um novo ' + resource;
        case 'read': return 'Recupera os dados de um ' + resource + ' a partir do identificador.';
        case 'update': return 'Atualiza os dados de um ' + resource;
        case 'search-type': return 'Pesquisa os dados de um ' + resource + ' conforme os parâmetros de pesquisa.';
        default: return 'TODO' + operation;
    }
}

function getRespByTypeAndOperation(resource, operation) {
    switch (operation) {
        case 'create': {
            return {
                '201': { description: resource + " criado com sucesso." },
                '500': { description: "Erro inesperado na operação." }
            };
        }
        case 'read': {
            return {
                '200': { description: "Retorna os dados de um " + resource + " a partir do identificador." },
                '404': { description: "Nenhum " + resource + " encontrado." }
            };
        }
        case 'update': {
            return {
                '204': { description: resource + " alterado com sucesso." },
                '500': { description: "Erro inesperado na operação." }
            };
        }
        /*case 'delete': {
            return {
                '200': { description: "Obter dados de um " + resource + " a partir do identificador lógico." },
                '500': { description: "Erro inesperado na operação." }
            };
        }*/
        case 'search-type': {
            return {
                '200': { description: "Retorna os dados de um " + resource + " conforme os parâmetros de pesquisa." },
                '404': { description: "Nenhum " + resource + " encontrado." }
            };
        }
        default: {
            return { '200': { description: "Operação realizada com sucesso." } };
        }
    }
}

