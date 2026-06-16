/**
 * SISTEMA DE MONITORAMENTO DE CARANGUEJOS - SCRIPT PARA GOOGLE APPS SCRIPT
 * 
 * INSTRUÇÕES:
 * 1. Crie uma planilha no Google Sheets (se não tiver).
 * 2. Crie uma pasta no Google Drive para salvar as fotos.
 * 3. Vá em "Extensões" > "Apps Script" na sua planilha.
 * 4. Apague todo o código existente lá e cole este código inteiro.
 * 5. Na esquerda, vá nas "Configurações" (ícone de engrenagem) > "Propriedades do script".
 * 6. Adicione as seguintes propriedades:
 *    - SPREADSHEET_ID: (O ID da sua planilha, que fica na URL)
 *    - SHEET_NAME: "Registros" (Ou o nome que quiser dar para a aba, por exemplo, "Página1")
 *    - DRIVE_FOLDER_ID: (O ID da pasta onde as fotos serão salvas, fica na URL da pasta)
 * 7. Clique em "Implantar" > "Nova implantação".
 * 8. Escolha o tipo "App da Web".
 * 9. Executar como: "Eu".
 * 10. Quem tem acesso: "Qualquer pessoa" (ou "Qualquer pessoa, até anônimos").
 * 11. Autorize os acessos pedidos.
 * 12. Copie a URL do App da Web e informe no aplicativo de monitoramento.
 */

function obterConfiguracoes() {
  var props = PropertiesService.getScriptProperties();
  return {
    SPREADSHEET_ID: props.getProperty('SPREADSHEET_ID') || '',
    SHEET_NAME: props.getProperty('SHEET_NAME') || 'Registros',
    DRIVE_FOLDER_ID: props.getProperty('DRIVE_FOLDER_ID') || ''
  };
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Nenhum dado recebido no payload.");
    }
    
    var payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseError) {
      throw new Error("O corpo da requisição não é um JSON válido.");
    }
    
    // Logs de diagnóstico solicitados
    var logPayload = JSON.parse(JSON.stringify(payload));
    if (logPayload.base64Data && logPayload.base64Data.length > 50) {
      logPayload.base64Data = "[IMAGEM PRESENTE]";
    } else {
      logPayload.base64Data = "[SEM IMAGEM]";
    }
    console.log('Payload recebido: ' + JSON.stringify(logPayload));
    console.log('Campos recebidos: ' + Object.keys(payload).join(', '));
    
    var config = obterConfiguracoes();
    if (!config.SPREADSHEET_ID) {
      throw new Error("SPREADSHEET_ID não está configurado nas Propriedades do Script.");
    }
    
    var ss = SpreadsheetApp.openById(config.SPREADSHEET_ID);
    var sheet = ss.getSheetByName(config.SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(config.SHEET_NAME);
    }
    
    var registroID = payload.id;
    if (!registroID) {
      throw new Error("ID do registro não foi enviado.");
    }
    
    // Obtém cabeçalhos (a primeira linha inteira)
    var maxCol = Math.max(sheet.getLastColumn(), 1);
    var headerRow = [];
    if (maxCol > 0) {
      headerRow = sheet.getRange(1, 1, 1, maxCol).getValues()[0];
    }
    
    // Se não houver cabeçalhos ou a planilha estiver quase vazia
    var isSheetEmpty = true;
    if (headerRow && headerRow.length > 0) {
      for (var col = 0; col < headerRow.length; col++) {
         var hl = normalizar(headerRow[col] || "");
         if (hl === "iddoregistro" || hl === "id" || hl === "registroid" || hl === "idregistro") {
           isSheetEmpty = false;
           break;
         }
      }
    }
    
    if (isSheetEmpty) {
       headerRow = inicializarCabecalhos(sheet);
    }
    
    // Verifica Duplicidade usando o cabeçalho 'ID do registro'
    if (verificarDuplicidade(sheet, headerRow, registroID)) {
      return criarRespostaJson({
        success: true,
        duplicate: true,
        message: "Registro já recebido anteriormente.",
        id: registroID
      });
    }
    
    var photoInfo = { id: "", url: "" };
    if (payload.base64Data && config.DRIVE_FOLDER_ID) {
      try {
        var base64Decoded = Utilities.base64Decode(payload.base64Data);
        var blob = Utilities.newBlob(base64Decoded, payload.mimeType || 'image/jpeg', payload.fileName || ('Crab_' + registroID + '.jpg'));
        var folder = DriveApp.getFolderById(config.DRIVE_FOLDER_ID);
        var file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        photoInfo.id = file.getId();
        photoInfo.url = file.getUrl();
      } catch (imgError) {
        console.error("Erro ao salvar a foto: " + imgError.message);
        photoInfo.url = "Erro no Upload: " + imgError.message;
      }
    }
    
    var location = payload.location || {};
    var dataRecebimento = new Date();
    
    // Cria um dicionário com os valores mapeados para chaves simplificadas (tudo minúsculo, sem acentos, sem espaços)
    var dadosMapeados = {};
    
    dadosMapeados["dataderecebimento"] = dataRecebimento;
    dadosMapeados["iddoregistro"] = registroID;
    dadosMapeados["dataehoraexibida"] = payload.timestamp || "";
    dadosMapeados["dataehoraiso"] = payload.timestampISO || "";
    dadosMapeados["datadoavistamento"] = payload.timestamp ? payload.timestamp.split(' ')[0] : "";
    dadosMapeados["diadasemana"] = payload.dia_da_semana || "";
    dadosMapeados["periodododia"] = payload.periodo_do_dia || "";
    dadosMapeados["latitude"] = payload.location?.latitude !== undefined ? payload.location.latitude : "";
    dadosMapeados["longitude"] = payload.location?.longitude !== undefined ? payload.location.longitude : "";
    dadosMapeados["precisaogpsemmetros"] = payload.precisao_gps_metros !== undefined ? payload.precisao_gps_metros : (location.accuracy || "");
    dadosMapeados["fontedalocalizacao"] = payload.fonte_localizacao || "";
    dadosMapeados["localizacaoextraidadafoto"] = location.isFromPhoto ? "Sim" : "Não";
    dadosMapeados["localizacaoobtidapeloaparelho"] = location.isFromDevice ? "Sim" : "Não";
    dadosMapeados["urldafotografia"] = photoInfo.url || "";
    dadosMapeados["iddafotografianodrive"] = photoInfo.id || "";
    dadosMapeados["nomedoarquivodafotografia"] = payload.fileName || "";
    dadosMapeados["estadodoanimal"] = payload.statusLabel || payload.status || "";
    dadosMapeados["corpredominante"] = payload.color || "";
    dadosMapeados["ovosvisiveis"] = payload.eggVisibility || "";
    dadosMapeados["quantidade"] = payload.amount || "1";
    dadosMapeados["tipodecontagem"] = payload.countType || "";
    dadosMapeados["ambiente"] = payload.habitat || "";
    dadosMapeados["sexo"] = payload.sex || "";
    dadosMapeados["classedetamanho"] = payload.sizeClass || "";
    
    dadosMapeados["padraodemovimento"] = payload.movementPatternLabel || payload.movementPattern || "";
    dadosMapeados["atividadeobservada"] = payload.activityLabel || payload.activity || "";
    dadosMapeados["comportamentocombinado"] = payload.behaviorLabel || payload.behavior || "";
    
    dadosMapeados["riscodeatropelamento"] = payload.collisionRisk || "";
    dadosMapeados["condicaodotempo"] = payload.weather || "";
    dadosMapeados["observacoes"] = payload.notes || "";
    dadosMapeados["faselunar"] = payload.fase_lunar || payload.moonPhase || "";
    dadosMapeados["idadelunar"] = payload.idade_lunar || payload.moonAge || "";
    dadosMapeados["iluminacaolunar"] = payload.iluminacao_lunar || payload.moonIllumination || "";
    dadosMapeados["dispositivoenavegador"] = payload.userAgent || "";
    dadosMapeados["statusdoprocessamento"] = "Salvo";

    // Identifica cabeçalhos essenciais que podem estar faltando na planilha do usuário
    var cabecalhosEsperados = inicializarCabecalhos(null, true);
    var headersAdicionados = false;
    
    // Função auxiliar para verificar se um cabeçalho já existe
    function temCabecalho(esperado) {
      var normEsperado = normalizar(esperado);
      for (var j = 0; j < headerRow.length; j++) {
        var hl = normalizar(headerRow[j] || "");
        if (hl === normEsperado) return true;
        // Verifica se o cabeçalho existente é um alias (ex: "ovos" já captura "ovosvisiveis")
        var dummy = {}; dummy[normEsperado] = "testematch";
        if (buscarValorParaHeader(headerRow[j], dummy) === "testematch") return true;
      }
      return false;
    }
    
    if (cabecalhosEsperados && cabecalhosEsperados.length > 0) {
      for (var i = 0; i < cabecalhosEsperados.length; i++) {
        if (!temCabecalho(cabecalhosEsperados[i])) {
          headerRow.push(cabecalhosEsperados[i]);
          headersAdicionados = true;
        }
      }
    }
    
    if (headersAdicionados) {
      // Atualiza a primeira linha com os novos cabeçalhos
      sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
      sheet.getRange(1, 1, 1, headerRow.length).setFontWeight("bold");
    }

    // Constrói a linha final alinhada de forma inteligente com os cabeçalhos atuais da planilha do usuário
    var novaLinha = [];
    for (var i = 0; i < headerRow.length; i++) {
        var colunaOriginal = headerRow[i] || "";
        var valorResolvido = buscarValorParaHeader(colunaOriginal, dadosMapeados);
        novaLinha.push(valorResolvido);
    }
    
    // Anexa a nova linha
    sheet.appendRow(novaLinha);
    var rowNum = sheet.getLastRow();
    
    return criarRespostaJson({
      success: true,
      duplicate: false,
      message: "Registro salvo com sucesso.",
      id: registroID,
      photoId: photoInfo.id,
      photoUrl: photoInfo.url,
      rowNumber: rowNum
    });
    
  } catch (error) {
    console.error("Erro na Execução: ", error.message, error.stack);
    return criarRespostaJson({
      success: false,
      message: error.message,
      errorCode: "APP_SCRIPT_ERROR"
    });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return HtmlService.createHtmlOutput("Servidor do Aplicativo de Monitoramento de Caranguejos Ativo.");
}

function criarRespostaJson(obj) {
  var saida = ContentService.createTextOutput(JSON.stringify(obj));
  saida.setMimeType(ContentService.MimeType.JSON);
  return saida;
}

// Função auxiliar para rodar manualmente e configurar a tela
function forcarCriacaoDeCabecalhos() {
  var config = obterConfiguracoes();
  if (!config.SPREADSHEET_ID) {
    throw new Error("Coloque o ID da planilha nas configurações primeiro!");
  }
  var ss = SpreadsheetApp.openById(config.SPREADSHEET_ID);
  var sheet = ss.getSheetByName(config.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(config.SHEET_NAME);
  }
  inicializarCabecalhos(sheet);
}

function inicializarCabecalhos(sheet, apenasRetornar) {
  var cabecalhosEsperados = [
    "Data de recebimento", "ID do registro", "Data e hora exibida", "Data e hora ISO", "Data do avistamento",
    "Dia da semana", "Período do dia", "Latitude", "Longitude", "Precisão GPS em metros", "Fonte da localização",
    "Localização extraída da foto", "Localização obtida pelo aparelho", "URL da fotografia", "ID da fotografia no Drive",
    "Nome do arquivo da fotografia", "Estado do animal", "Cor predominante", "Ovos visíveis", "Quantidade",
    "Tipo de contagem", "Ambiente", "Sexo", "Classe de tamanho", "Padrão de movimento", "Atividade observada",
    "Comportamento combinado", "Risco de atropelamento", "Condição do tempo", "Observações", "Fase lunar",
    "Idade lunar", "Iluminação lunar", "Dispositivo e navegador", "Status do processamento"
  ];
  
  if (!apenasRetornar && sheet) {
    sheet.getRange(1, 1, 1, cabecalhosEsperados.length).setValues([cabecalhosEsperados]);
    sheet.getRange(1, 1, 1, cabecalhosEsperados.length).setFontWeight("bold");
    try {
      sheet.setFrozenRows(1);
    } catch (e) {} // Evita erros se a planilha já estiver formatada de forma restrita
  }
  
  return cabecalhosEsperados;
}

function verificarDuplicidade(sheet, headerRow, id) {
  var urlLastRow = sheet.getLastRow();
  if (urlLastRow < 2) return false;
  
  var idColIndex = -1;
  for (var i = 0; i < headerRow.length; i++) {
     var normH = normalizar((headerRow[i] || "").trim());
     if (normH === "iddoregistro" || normH === "id" || normH === "registroid" || normH === "idregistro") {
         idColIndex = i + 1;
         break;
     }
  }
  
  if (idColIndex === -1) return false;
  
  var ids = sheet.getRange(2, idColIndex, urlLastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] == id) {
      return true;
    }
  }
  return false;
}

function normalizar(texto) {
  if (!texto) return "";
  return texto.toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9]/g, "") // remove caracteres especiais e espaços
    .trim();
}

function buscarValorParaHeader(headerOriginal, dadosMapeados) {
  var normHeader = normalizar(headerOriginal);
  if (!normHeader) return "";
  
  // 1. Verificação de correspondência exata
  if (dadosMapeados[normHeader] !== undefined) {
    return dadosMapeados[normHeader];
  }
  
  // 2. Dicionário de Sinônimos/Aliases comuns
  var aliases = {
    // de recebimento
    "dataderece": "dataderecebimento",
    "datadereceb": "dataderecebimento",
    "recebimento": "dataderecebimento",
    "datarecebimento": "dataderecebimento",
    "datadeenvio": "dataderecebimento",
    
    // ID do registro
    "id": "iddoregistro",
    "registroid": "iddoregistro",
    "idregistro": "iddoregistro",
    
    // Data e hora exibida
    "dataehora": "dataehoraexibida",
    "dataehoradoavistamento": "dataehoraexibida",
    "datahora": "dataehoraexibida",
    "timestamp": "dataehoraexibida",
    
    // Data/hora ISO
    "dataehoraisotimestamp": "dataehoraiso",
    "dataehoraisc": "dataehoraiso",
    "datahoraiso": "dataehoraiso",
    "iso": "dataehoraiso",
    
    // Data do avistamento
    "datadoavist": "datadoavistamento",
    "datadoavisto": "datadoavistamento",
    "datadoavistamentotexto": "datadoavistamento",
    "diadoavistamento": "datadoavistamento",
    "data": "datadoavistamento",
    
    // Período do dia
    "periodododo": "periodododia",
    "periodo": "periodododia",
    "urnadiada": "periodododia",
    
    // Precisão GPS
    "precisaogps": "precisaogpsemmetros",
    "precisao": "precisaogpsemmetros",
    "precisaogpse": "precisaogpsemmetros",
    "precisaodogps": "precisaogpsemmetros",
    "accuracy": "precisaogpsemmetros",
    
    // Fonte da localização
    "fontedalocaliz": "fontedalocalizacao",
    "fontelocalizacao": "fontedalocalizacao",
    
    // Localizações ext e ob
    "localizacaoext": "localizacaoextraidadafoto",
    "localizacaofoto": "localizacaoextraidadafoto",
    "extraidadafoto": "localizacaoextraidadafoto",
    "localizacaoob": "localizacaoobtidapeloaparelho",
    "localizacaoaparelho": "localizacaoobtidapeloaparelho",
    "obtidapeloaparelho": "localizacaoobtidapeloaparelho",
    
    // URL/ID Fotos
    "urldafotogra": "urldafotografia",
    "urldafoto": "urldafotografia",
    "fotourl": "urldafotografia",
    "url": "urldafotografia",
    "iddafotogra": "iddafotografianodrive",
    "iddafoto": "iddafotografianodrive",
    "iddafotografianodrive": "iddafotografianodrive",
    "iddrive": "iddafotografianodrive",
    
    // Outros campos
    "nomearquivo": "nomedoarquivodafotografia",
    "status": "estadodoanimal",
    "estado": "estadodoanimal",
    "condicao": "estadodoanimal",
    "cor": "corpredominante",
    "ovos": "ovosvisiveis",
    "quant": "quantidade",
    "qtd": "quantidade",
    "contagem": "tipodecontagem",
    "habitat": "ambiente",
    "tamanho": "classedetamanho",
    "sexo": "sexo",
    
    // Ele estava andando ou parado? (padraodemovimento)
    "movimento": "padraodemovimento",
    "padraoodemovimento": "padraodemovimento",
    "eleestavaandandoouparado": "padraodemovimento",
    "elesestavaandandoouparado": "padraodemovimento",
    "estavaandandoouparado": "padraodemovimento",
    "andandoouparado": "padraodemovimento",
    
    "atividade": "atividadeobservada",
    "acao": "atividadeobservada",
    "comportamento": "comportamentocombinado",
    "risco": "riscodeatropelamento",
    "tempo": "condicaodotempo",
    "obs": "observacoes",
    "notes": "observacoes",
    "anotacoes": "observacoes",
    "fasedalua": "faselunar",
    "lua": "faselunar",
    "idadelua": "idadelunar",
    "iluminacaolua": "iluminacaolunar",
    "useragent": "dispositivoenavegador"
  };
  
  if (aliases[normHeader] !== undefined) {
    var chaveDestino = aliases[normHeader];
    if (dadosMapeados[chaveDestino] !== undefined) {
      return dadosMapeados[chaveDestino];
    }
  }
  
  // Retorna vazio caso não exista correspondência exata nem alias segurando integridade absoluta
  return "";
}
