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
    var existingRowIndex = obterLinhaExistente(sheet, headerRow, registroID);
    var photoInfo = { id: "", url: "" };
    
    // Se a linha já existe, pegamos a foto original dela para não duplicar no Drive
    if (existingRowIndex > -1) {
      for (var i = 0; i < headerRow.length; i++) {
        var n = normalizar((headerRow[i] || "").trim());
        if (n === "urldafotografia" || n === "urldafotogra" || n === "url") {
          photoInfo.url = sheet.getRange(existingRowIndex, i + 1).getValue();
        }
        if (n === "iddafotografianodrive" || n === "iddafotogra" || n === "iddrive") {
          photoInfo.id = sheet.getRange(existingRowIndex, i + 1).getValue();
        }
      }
    }
    
    if (!photoInfo.url && payload.base64Data && config.DRIVE_FOLDER_ID) {
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
    
    var isGroup = payload.observationMode === "group";
    var msgColetiva = "Composição coletiva — consultar colunas específicas";

    dadosMapeados["dataderecebimento"] = dataRecebimento;
    dadosMapeados["iddoregistro"] = registroID;
    dadosMapeados["ilha"] = payload.island || "Fernando de Noronha"; // Padrão caso não enviado
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
    
    dadosMapeados["tipoderegistro"] = isGroup ? "Coletivo" : "Individual";
    dadosMapeados["totaldeindividuos"] = payload.totalIndividuals || payload.amount || "1";
    dadosMapeados["quantidade"] = payload.amount || "1";
    dadosMapeados["tipodecontagem"] = payload.countType || "";
    dadosMapeados["ambiente"] = payload.habitat || "";

    dadosMapeados["estadodoanimal"] = isGroup ? msgColetiva : (payload.statusLabel || payload.status || "");
    dadosMapeados["corpredominante"] = isGroup ? msgColetiva : (payload.color || "");
    dadosMapeados["ovosvisiveis"] = isGroup ? msgColetiva : (payload.eggVisibility || "");
    dadosMapeados["sexo"] = isGroup ? msgColetiva : (payload.sex || "");
    dadosMapeados["classedetamanho"] = isGroup ? msgColetiva : (payload.sizeClass || "");
    dadosMapeados["padraodemovimento"] = isGroup ? msgColetiva : (payload.movementPatternLabel || payload.movementPattern || "");
    dadosMapeados["atividadeobservada"] = isGroup ? msgColetiva : (payload.activityLabel || payload.activity || "");
    dadosMapeados["comportamentocombinado"] = isGroup ? msgColetiva : (payload.behaviorLabel || payload.behavior || "");
    
    // Group Observation Fields
    dadosMapeados["machos"] = payload.maleCount !== undefined ? payload.maleCount : "";
    dadosMapeados["femeas"] = payload.femaleCount !== undefined ? payload.femaleCount : "";
    dadosMapeados["sexonaoidentificado"] = payload.sexUnknownCount !== undefined ? payload.sexUnknownCount : "";

    dadosMapeados["femeasovigeras"] = payload.ovigerousFemaleCount !== undefined ? payload.ovigerousFemaleCount : "";
    dadosMapeados["femeassemovosvisiveis"] = payload.nonOvigerousFemaleCount !== undefined ? payload.nonOvigerousFemaleCount : "";
    dadosMapeados["ovosnaoobservados"] = payload.eggVisibilityUnknownCount !== undefined ? payload.eggVisibilityUnknownCount : "";

    dadosMapeados["individuospequenos"] = payload.smallCount !== undefined ? payload.smallCount : "";
    dadosMapeados["individuosmedios"] = payload.mediumCount !== undefined ? payload.mediumCount : "";
    dadosMapeados["individuosgrandes"] = payload.largeCount !== undefined ? payload.largeCount : "";
    dadosMapeados["tamanhonaoidentificado"] = payload.sizeUnknownCount !== undefined ? payload.sizeUnknownCount : "";

    dadosMapeados["individuosvivos"] = payload.aliveCount !== undefined ? payload.aliveCount : "";
    dadosMapeados["atropeladosvivos"] = payload.injuredRoadkillCount !== undefined ? payload.injuredRoadkillCount : "";
    dadosMapeados["atropeladosmortos"] = payload.deadRoadkillCount !== undefined ? payload.deadRoadkillCount : "";
    dadosMapeados["mortossematropelamentoidentificado"] = payload.deadOtherCount !== undefined ? payload.deadOtherCount : "";
    dadosMapeados["estadonaoidentificado"] = payload.statusUnknownCount !== undefined ? payload.statusUnknownCount : "";

    dadosMapeados["individuoslaranjaouavermelhados"] = payload.orangeCrabCount !== undefined ? payload.orangeCrabCount : "";
    dadosMapeados["individuosamarelos"] = payload.yellowCrabCount !== undefined ? payload.yellowCrabCount : "";
    dadosMapeados["individuosroxosouescuros"] = payload.purpleCrabCount !== undefined ? payload.purpleCrabCount : "";
    dadosMapeados["individuoscomoutracor"] = payload.otherColorCrabCount !== undefined ? payload.otherColorCrabCount : "";
    dadosMapeados["cornaoidentificada"] = payload.unknownColorCrabCount !== undefined ? payload.unknownColorCrabCount : "";

    dadosMapeados["individuoscomdeslocamento"] = payload.movingCount !== undefined ? payload.movingCount : "";
    dadosMapeados["individuossemsemovermasativos"] = payload.stationaryActiveCount !== undefined ? payload.stationaryActiveCount : "";
    dadosMapeados["individuostotalmenteparados"] = payload.totallyStillCount !== undefined ? payload.totallyStillCount : "";
    dadosMapeados["movimentonaoobservado"] = payload.movementUnknownCount !== undefined ? payload.movementUnknownCount : "";

    dadosMapeados["individuosalimentandose"] = payload.feedingCount !== undefined ? payload.feedingCount : "";
    dadosMapeados["individuoscavando"] = payload.diggingCount !== undefined ? payload.diggingCount : "";
    dadosMapeados["individuoslimpandoquelasoupatas"] = payload.groomingCount !== undefined ? payload.groomingCount : "";
    dadosMapeados["individuoseminteracao"] = payload.interactionCount !== undefined ? payload.interactionCount : "";
    dadosMapeados["individuosemcopula"] = payload.copulationCount !== undefined ? payload.copulationCount : "";
    dadosMapeados["individuosemoutraatividade"] = payload.otherActivityCount !== undefined ? payload.otherActivityCount : "";
    dadosMapeados["atividadenaoidentificada"] = payload.activityUnknownCount !== undefined ? payload.activityUnknownCount : "";

    dadosMapeados["contextocoletivodaobservacao"] = payload.groupContext || "";
    dadosMapeados["observacoesdocontextocoletivo"] = payload.groupContextNotes || "";
    dadosMapeados["resumodaobservacaocoletiva"] = payload.groupSummary || "";
    
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
    
    var rowNum;
    if (existingRowIndex > -1) {
      // Atualiza a linha existente
      sheet.getRange(existingRowIndex, 1, 1, novaLinha.length).setValues([novaLinha]);
      rowNum = existingRowIndex;
    } else {
      // Anexa a nova linha
      sheet.appendRow(novaLinha);
      rowNum = sheet.getLastRow();
    }
    
    return criarRespostaJson({
      success: true,
      duplicate: false,
      updated: existingRowIndex > -1,
      message: existingRowIndex > -1 ? "Registro atualizado com sucesso." : "Registro salvo com sucesso.",
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

function migrarPlanilha() {
  var config = obterConfiguracoes();
  if (!config.SPREADSHEET_ID) {
    throw new Error("Coloque o ID da planilha nas configurações primeiro!");
  }
  var ss = SpreadsheetApp.openById(config.SPREADSHEET_ID);
  var sheet = ss.getSheetByName(config.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(config.SHEET_NAME);
  }
  
  var cabecalhos = inicializarCabecalhos(null, true);
  var maxCol = Math.max(sheet.getLastColumn(), 1);
  var headerRow = [];
  if (maxCol > 0) {
    headerRow = sheet.getRange(1, 1, 1, maxCol).getValues()[0];
  }
  
  var headersAdicionados = false;
  function temCabecalho(esperado) {
    var normEsperado = normalizar(esperado);
    for (var j = 0; j < headerRow.length; j++) {
      var hl = normalizar(headerRow[j] || "");
      if (hl === normEsperado) return true;
    }
    return false;
  }
  
  for (var i = 0; i < cabecalhos.length; i++) {
    if (!temCabecalho(cabecalhos[i])) {
      headerRow.push(cabecalhos[i]);
      headersAdicionados = true;
    }
  }
  
  if (headersAdicionados) {
    sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
    sheet.getRange(1, 1, 1, headerRow.length).setFontWeight("bold");
    try { sheet.setFrozenRows(1); } catch (e) {}
  }
}

// Função auxiliar para rodar manualmente e configurar a tela
function forcarCriacaoDeCabecalhos() {
  migrarPlanilha();
}

function inicializarCabecalhos(sheet, apenasRetornar) {
  var cabecalhosEsperados = [
    "Data de recebimento", "ID do registro", "Ilha", "Tipo de registro", "Total de indivíduos", 
    "Data e hora exibida", "Data e hora ISO", "Data do avistamento",
    "Dia da semana", "Período do dia", "Latitude", "Longitude", "Precisão GPS em metros", "Fonte da localização",
    "Localização extraída da foto", "Localização obtida pelo aparelho", "URL da fotografia", "ID da fotografia no Drive",
    "Nome do arquivo da fotografia", "Estado do animal", "Cor predominante", "Ovos visíveis", "Quantidade",
    "Tipo de contagem", "Ambiente", "Sexo", "Classe de tamanho", "Padrão de movimento", "Atividade observada",
    "Comportamento combinado", 
    "Machos", "Fêmeas", "Sexo não identificado",
    "Fêmeas ovígeras", "Fêmeas sem ovos visíveis", "Ovos não observados",
    "Indivíduos pequenos", "Indivíduos médios", "Indivíduos grandes", "Tamanho não identificado",
    "Indivíduos vivos", "Atropelados vivos", "Atropelados mortos", "Mortos sem atropelamento identificado", "Estado não identificado",
    "Indivíduos laranja ou avermelhados", "Indivíduos amarelos", "Indivíduos roxos ou escuros", "Indivíduos com outra cor", "Cor não identificada",
    "Indivíduos com deslocamento", "Indivíduos sem se mover, mas ativos", "Indivíduos totalmente parados", "Movimento não observado",
    "Indivíduos alimentando-se", "Indivíduos cavando", "Indivíduos limpando quelas ou patas", "Indivíduos em interação", "Indivíduos em cópula", "Indivíduos em outra atividade", "Atividade não identificada",
    "Contexto coletivo da observação", "Observações do contexto coletivo", "Resumo da observação coletiva",
    "Risco de atropelamento", "Condição do tempo", "Observações", "Fase lunar",
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

function obterLinhaExistente(sheet, headerRow, id) {
  var urlLastRow = sheet.getLastRow();
  if (urlLastRow < 2) return -1;
  
  var idColIndex = -1;
  for (var i = 0; i < headerRow.length; i++) {
     var normH = normalizar((headerRow[i] || "").trim());
     if (normH === "iddoregistro" || normH === "id" || normH === "registroid" || normH === "idregistro") {
         idColIndex = i + 1;
         break;
     }
  }
  
  if (idColIndex === -1) return -1;
  
  var ids = sheet.getRange(2, idColIndex, urlLastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] == id) {
      return i + 2; // Linha real (0-based array + 2)
    }
  }
  return -1;
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
