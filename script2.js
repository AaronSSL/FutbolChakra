document.addEventListener("DOMContentLoaded", async () => {
  // Configuración de Supabase
  const SUPABASE_URL = "https://bbldcocvxmzztvkaowbd.supabase.co"
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibGRjb2N2eG16enR2a2Fvd2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1NDc5NDgsImV4cCI6MjA1OTEyMzk0OH0.JILUByfv8ZM1BiEjkmb0uDOd7e3m-MtgDW8XfC9FkRg"

  // Inicializar Supabase correctamente
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // Elementos del DOM
  const playerInput = document.getElementById("player-input")
  const submitBtn = document.getElementById("submit-btn")
  const messageContainer = document.getElementById("message-container")

  let gameCompleted = false

  // Estado del juego
  const gameState = {
    topClubs: [],
    leftClubs: [],
    gridAnswers: [],
    filledCells: new Set(),
    highlightedCells: [], // Para almacenar las celdas que pueden tener la misma respuesta
    currentAnswer: null, // Para almacenar la respuesta actual que se está colocando
  }

  // =====================================================
  // CONFIGURACIÓN DEL GRID - MODIFICA ESTOS VALORES
  // =====================================================

  // IDs de los clubes que aparecerán en la parte superior
  const TOP_CLUB_IDS = [1, 2, 3]

  // IDs de los clubes que aparecerán en la parte izquierda
  const LEFT_CLUB_IDS = [20, 15, 21]

  // Respuestas válidas para cada intersección
  // Formato: [fila][columna] = [array de apellidos]
  const MANUAL_ANSWERS = [
    // Fila 1
    [
      [
        { nombres: ["Jairo Velez", "velez", "jairo vélez"] },
        { nombres: ["José Carvallo", "Carvallo", "carvallo", "jose carvallo"] },
        { nombres: ["Alexis Ubillús", "Ubillús", "Ubillus", "ubillus"] },
        { nombres: ["Carlos Orejuela", "Orejuela"] },
        { nombres: ["Christian Ramos", "Ramos"] },
        { nombres: ["Gerson Barreto", "Barreto"] },
        { nombres: ["Jersson Vásquez", "Vásquez", "jersson vasquez"] },
        { nombres: ["Ángel Romero", "Romero", "ángel romero"] },
      ],
      [
        { nombres: ["Christian Ramos", "Ramos"] },
        { nombres: ["Carlos Orejuela", "Orejuela"] },
        { nombres: ["Josepmir Ballón","Ballon"] },
        { nombres: ["Paolo Guerrero","Guerrero"] },
      ],
      [
        { nombres: ["Johan Madrid","Madrid","madrid","johan madrid"] }, 
        { nombres: ["muller"] }, 
        { nombres: ["neuer"] },
      ],
    ],
    // Fila 2
    [
      [
        { nombres: ["Luis Urruti","urruti"] }, 
        { nombres: ["Alejandro Hohberg","Hohberg"]  }, 
        { nombres: ["icardi"] }
      ]
        ,
      [
        { nombres: ["Alejandro Hohberg","Hohberg"]  }, 
        { nombres: ["Joao Villamarín","Villamarín"] }, 
        { nombres: ["Christian Ramos", "Ramos"]},
        { nombres: ["Marquinho", "Dos Santos"]}
      ],
      [
        { nombres: ["Alejandro Hohberg","Hohberg"] }, 
        { nombres: [""] }, 
        { nombres: ["de bruyne"] }
      ],
    ],
    // Fila 3
    [
      [
        { nombres: ["Teodoro Fernandez","lolo","Lolo Fernandez"]}, 
        { nombres: ["firmino"] }, 
        { nombres: ["mane"] }
      ],
      [
        { nombres: ["Waldir Saenz","Waldir","Saenz"] }, 
        { nombres: ["gavi"] }, 
        { nombres: ["busquets"] }],
      [
        { nombres: ["Bonet"] }, 
        { nombres: ["son"] }, 
        { nombres: ["lloris"] }
      ],
    ],
  ]

  // =====================================================
  // FIN DE LA CONFIGURACIÓN
  // =====================================================

  // Función para cargar los clubes por ID
  async function loadClubsById(topIds, leftIds) {
    try {
      // Obtener los clubes superiores
      const { data: topClubs, error: topError } = await supabase
        .from("club")
        .select("id_club, nombre, imagen_club")
        .in("id_club", topIds)

      if (topError) throw topError

      // Obtener los clubes izquierdos
      const { data: leftClubs, error: leftError } = await supabase
        .from("club")
        .select("id_club, nombre, imagen_club")
        .in("id_club", leftIds)

      if (leftError) throw leftError

      // Ordenar los clubes según el orden de los IDs proporcionados
      const sortedTopClubs = topIds.map((id) => topClubs.find((club) => club.id_club === id)).filter(Boolean)
      const sortedLeftClubs = leftIds.map((id) => leftClubs.find((club) => club.id_club === id)).filter(Boolean)

      // Guardar los clubes en el estado del juego
      gameState.topClubs = sortedTopClubs
      gameState.leftClubs = sortedLeftClubs

      // Mostrar los clubes en la interfaz
      displayClubs(sortedTopClubs, sortedLeftClubs)

      // Reiniciar el estado del juego
      gameState.filledCells = new Set()
      resetGridCells()

      return true
    } catch (error) {
      console.error("Error al cargar clubes por ID:", error)
      showMessage("Error al cargar los clubes. Verifica los IDs.", "error")
      return false
    }
  }

  function loadManualAnswers(manualAnswers) {
    gameState.gridAnswers = manualAnswers
    console.log("Respuestas manuales cargadas:", gameState.gridAnswers)
  }

  // Función para reiniciar las celdas del grid
  function resetGridCells() {
    const gridCells = document.querySelectorAll(".grid-cell")
    gridCells.forEach((cell) => {
      cell.classList.remove("filled", "correct", "highlighted")
      cell.removeAttribute("data-player")
    })
  }

  // Función para mostrar los clubes en la interfaz
  function displayClubs(topClubs, leftClubs) {
    // Mostrar clubes en la parte superior
    topClubs.forEach((club, index) => {
      const clubCell = document.getElementById(`top-${index + 1}`)
      const clubImage = clubCell.querySelector(".club-image")
      const clubName = clubCell.querySelector(".club-name")

      clubImage.style.backgroundImage = `url(${club.imagen_club})`
      clubName.textContent = club.nombre
    })

    // Mostrar clubes en la parte izquierda
    leftClubs.forEach((club, index) => {
      const clubCell = document.getElementById(`left-${index + 1}`)
      const clubImage = clubCell.querySelector(".club-image")
      const clubName = clubCell.querySelector(".club-name")

      clubImage.style.backgroundImage = `url(${club.imagen_club})`
      clubName.textContent = club.nombre
    })
  }

  // Función para verificar la respuesta del usuario
  function checkAnswer(input) {
    const apellido = input.trim().toLowerCase()

    if (!apellido) {
      showMessage("Por favor, ingresa un apellido", "error")
      return
    }

    // Limpiar cualquier resaltado anterior
    clearHighlightedCells()

    // Buscar todas las celdas donde la respuesta es válida
    const validCells = []

    // Recorrer todas las celdas del grid
    for (let row = 0; row < gameState.gridAnswers.length; row++) {
      for (let col = 0; col < gameState.gridAnswers[row].length; col++) {
        // Verificar si la celda ya está llena
        const cellKey = `${row}-${col}`
        if (gameState.filledCells.has(cellKey)) continue

        // Verificar si el apellido coincide con alguna respuesta
        const answers = gameState.gridAnswers[row][col]
        const matchingPlayer = answers.find((player) =>
          player.nombres.some((nombre) => nombre.toLowerCase() === apellido),
        )

        if (matchingPlayer) {
          validCells.push({
            row,
            col,
            player: matchingPlayer,
          })
        }
      }
    }

    // Si no se encontraron celdas válidas
    if (validCells.length === 0) {
      showMessage("Jugador no encontrado o ya utilizado. Intenta con otro apellido.", "error")
      playerInput.value = ""
      return
    }

    // Si solo hay una celda válida, colocar la respuesta directamente
    if (validCells.length === 1) {
      const { row, col, player } = validCells[0]
      placeAnswer(row, col, player)
      playerInput.value = ""
      return
    }

    // Si hay múltiples celdas válidas, resaltarlas y permitir al usuario elegir
    gameState.highlightedCells = validCells
    gameState.currentAnswer = apellido

    // Resaltar las celdas válidas
    validCells.forEach(({ row, col }) => {
      const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`)
      cell.classList.add("highlighted")

      // Agregar evento de clic para seleccionar la celda
      cell.addEventListener("click", handleCellClick)
    })

    showMessage("Múltiples posiciones posibles. Haz clic en la celda donde deseas colocar al jugador.", "success")
  }

  // Función para manejar el clic en una celda resaltada
  function handleCellClick(event) {
    const cell = event.currentTarget
    const row = Number.parseInt(cell.getAttribute("data-row"))
    const col = Number.parseInt(cell.getAttribute("data-col"))

    // Buscar el jugador correspondiente en las celdas resaltadas
    const cellInfo = gameState.highlightedCells.find((c) => c.row === row && c.col === col)

    if (cellInfo) {
      // Colocar la respuesta en la celda seleccionada
      placeAnswer(row, col, cellInfo.player)

      // Limpiar las celdas resaltadas
      clearHighlightedCells()

      // Limpiar el input
      playerInput.value = ""
    }
  }

  // Función para colocar una respuesta en una celda
  function placeAnswer(row, col, player) {
    const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`)
    cell.classList.add("filled", "correct")
    cell.setAttribute("data-player", player.nombres[0].toUpperCase())

    // Agregar la celda a las celdas llenas
    const cellKey = `${row}-${col}`
    gameState.filledCells.add(cellKey)

    showMessage(`¡Correcto! ${player.nombres[0].toUpperCase()} es una respuesta válida.`, "success")

    // Verificar si el juego ha terminado
    checkGameCompletion()
  }

  // Función para limpiar las celdas resaltadas
  function clearHighlightedCells() {
    // Eliminar la clase highlighted de todas las celdas
    document.querySelectorAll(".grid-cell.highlighted").forEach((cell) => {
      cell.classList.remove("highlighted")
      cell.removeEventListener("click", handleCellClick)
    })

    // Limpiar el estado
    gameState.highlightedCells = []
    gameState.currentAnswer = null
  }

  // Función para verificar si el juego ha terminado
  function checkGameCompletion() {
    const totalCells = gameState.gridAnswers.length * gameState.gridAnswers[0].length

    if (gameState.filledCells.size === totalCells) {
      gameCompleted = true
  
        setTimeout(async () => {
          // Verificar si el usuario está autenticado para sumar puntos
          if (typeof window.completeGame === "function") {
            await window.completeGame(2) // Juego 2 completado
          }
        }, 500)    
        playerInput.disabled = true
        submitBtn.disabled = true
        return true
    }
  }
  function showMessage(message, type = "info") {
    let messageContainer = document.getElementById("message-container")
  
    if (!messageContainer) {
      // Crear contenedor de mensajes si no existe
      messageContainer = document.createElement("div")
      messageContainer.id = "message-container"
      document.body.appendChild(messageContainer)
  
    }
    messageContainer.style.position = "fixed"
    messageContainer.style.top = "52px"
    messageContainer.style.right = "120px"
    messageContainer.style.zIndex = "1000"
  
    const messageElement = document.createElement("div")
    messageElement.className = `message ${type}`
    messageElement.textContent = message
  
    // Estilos para el mensaje
    messageElement.style.padding = "10px 15px"
    messageElement.style.marginBottom = "10px"
    messageElement.style.borderRadius = "5px"
    messageElement.style.fontWeight = "bold"
  
    // Colores según el tipo
    switch (type) {
      case "success":
        messageElement.style.backgroundColor = "#4CAF50"
        messageElement.style.color = "white"
        break
      case "error":
        messageElement.style.backgroundColor = "#F44336"
        messageElement.style.backgroundColor = "#F44336"
        messageElement.style.color = "white"
        break
      case "warning":
        messageElement.style.backgroundColor = "#FF9800"
        messageElement.style.backgroundColor = "#F44336"
        messageElement.style.color = "white"
        break
      default:
        messageElement.style.backgroundColor = "#2196F3"
        messageElement.style.backgroundColor = "#F44336"
        messageElement.style.color = "white"
    }
  
    messageContainer.appendChild(messageElement)
  
    // Eliminar mensaje después de 3 segundos
    setTimeout(() => {
      messageElement.remove()
    }, 3000)
  }
  // Event listeners
  submitBtn.addEventListener("click", () => {
    checkAnswer(playerInput.value)
  })

  playerInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      checkAnswer(playerInput.value)
    }
  })

  // Inicializar el juego
  async function initGame() {
    try {
      // Cargar los clubes usando los IDs configurados
      const clubsLoaded = await loadClubsById(TOP_CLUB_IDS, LEFT_CLUB_IDS)

      if (clubsLoaded) {
        // Cargar las respuestas manuales
        loadManualAnswers(MANUAL_ANSWERS)
      }
    } catch (error) {
      console.error("Error al inicializar el juego:", error)
      showMessage("Error al inicializar el juego. Por favor, recarga la página.", "error")
    }
  }

  // Iniciar el juego
  initGame()
})
