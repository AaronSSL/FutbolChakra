document.addEventListener("DOMContentLoaded", async () => {
    // Configuración de Supabase
    const SUPABASE_URL = "https://bbldcocvxmzztvkaowbd.supabase.co"
    const SUPABASE_ANON_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibGRjb2N2eG16enR2a2Fvd2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1NDc5NDgsImV4cCI6MjA1OTEyMzk0OH0.JILUByfv8ZM1BiEjkmb0uDOd7e3m-MtgDW8XfC9FkRg"
  
    // Inicializar Supabase correctamente
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
    // Variable para almacenar el apellido seleccionado
    let selectedLastName = ""
    let maxLength = 0
    let gameCompleted = false
  
    // Función para obtener un jugador aleatorio
    async function getRandomPlayer() {
      try {
        // Obtener todos los jugadores
        const { data, error } = await supabase.from("jugador").select("apellido")
  
        if (error) {
          throw error
        }
  
        if (data && data.length > 0) {
          // Seleccionar un jugador aleatorio
          const randomIndex = Math.floor(Math.random() * data.length)
          const player = data[2]
  
          // Obtener el apellido y convertirlo a minúsculas
          selectedLastName = player.apellido.toLowerCase()
          console.log("Apellido seleccionado:", selectedLastName)
  
          // Determinar la longitud máxima para la cuadrícula
          maxLength = selectedLastName.length
  
          // Configurar la cuadrícula según la longitud del apellido
          setupGrid(maxLength)
  
          return selectedLastName
        } else {
          throw new Error("No se encontraron jugadores en la base de datos")
        }
      } catch (error) {
        console.error("Error al obtener jugador aleatorio:", error)
        alert("Error al conectar con la base de datos. Por favor, recarga la página.")
        return null
      }
    }
  
    // Función para configurar la cuadrícula según la longitud del apellido
    function setupGrid(length) {
      const gameGrid = document.querySelector(".game-grid")
      gameGrid.innerHTML = "" // Limpiar la cuadrícula existente
  
      // Actualizar el estilo de la cuadrícula para el número correcto de columnas
      gameGrid.style.gridTemplateColumns = `repeat(${length}, 1fr)`
  
      // Crear 6 filas con el número correcto de columnas
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < length; col++) {
          const tile = document.createElement("div")
          tile.className = "game-tile"
          tile.dataset.row = row
          tile.dataset.col = col
          gameGrid.appendChild(tile)
        }
      }
  
      // Reiniciar el estado del juego con el nuevo tamaño
      gameState.grid = Array(6)
        .fill()
        .map(() => Array(length).fill(""))
      gameState.currentRow = 0
      gameState.currentCol = 0
      gameState.maxLength = length
    }
  
    // Estado del juego
    const gameState = {
      currentRow: 0,
      currentCol: 0,
      grid: [],
      maxLength: 0,
    }
  
    // Función para actualizar la visualización de la cuadrícula
    function updateGridDisplay() {
      const gameTiles = document.querySelectorAll(".game-tile")
  
      for (let i = 0; i < gameTiles.length; i++) {
        const tile = gameTiles[i]
        const row = Number.parseInt(tile.dataset.row)
        const col = Number.parseInt(tile.dataset.col)
  
        if (row < gameState.grid.length && col < gameState.grid[row].length) {
          const letter = gameState.grid[row][col]
  
          // Actualizar el contenido del cuadro
          tile.textContent = letter
  
          // Aplicar estilo si hay una letra
          if (letter) {
            tile.classList.add("filled")
          } else {
            tile.classList.remove("filled")
            // Solo quitar clases de estado si está vacío
            tile.classList.remove("correct", "wrong-position", "incorrect")
          }
        }
      }
    }
  
    // Función para actualizar el teclado
    function updateKeyboard(row) {
      if (!selectedLastName) return
  
      const word = gameState.grid[row].join("").toLowerCase()
      const lastNameArray = selectedLastName.split("")
      const keyButtons = document.querySelectorAll(".key")
  
      // Recorrer cada letra de la palabra ingresada
      for (let i = 0; i < word.length; i++) {
        const letter = word[i]
  
        // Buscar el botón correspondiente a esta letra
        keyButtons.forEach((button) => {
          if (button.textContent.toLowerCase() === letter) {
            // Determinar el estado de la letra
            if (letter === lastNameArray[i]) {
              // Letra correcta en posición correcta
              button.classList.add("key-correct")
              button.classList.remove("key-wrong-position", "key-incorrect")
            } else if (lastNameArray.includes(letter)) {
              // Letra correcta en posición incorrecta (solo si no está ya marcada como correcta)
              if (!button.classList.contains("key-correct")) {
                button.classList.add("key-wrong-position")
                button.classList.remove("key-incorrect")
              }
            } else {
              // Letra incorrecta (solo si no está ya marcada como correcta o en posición incorrecta)
              if (!button.classList.contains("key-correct") && !button.classList.contains("key-wrong-position")) {
                button.classList.add("key-incorrect")
              }
            }
          }
        })
      }
    }
  
    // Función para verificar la palabra ingresada
    function checkWord(row) {
      if (!selectedLastName) return
  
      const word = gameState.grid[row].join("").toLowerCase()
      const lastNameArray = selectedLastName.split("")
      const gameTiles = document.querySelectorAll(`.game-tile[data-row="${row}"]`)
  
      // Primero marcar las letras correctas
      for (let i = 0; i < word.length; i++) {
        const tile = gameTiles[i]
        const letter = word[i]
  
        if (letter === lastNameArray[i]) {
          // Letra correcta en posición correcta
          tile.classList.add("correct")
          // Marcar esta letra como ya verificada
          lastNameArray[i] = null
        }
      }
  
      // Luego marcar las letras en posición incorrecta o incorrectas
      for (let i = 0; i < word.length; i++) {
        const tile = gameTiles[i]
        const letter = word[i]
  
        // Si ya está marcada como correcta, saltar
        if (tile.classList.contains("correct")) continue
  
        const indexInLastName = lastNameArray.indexOf(letter)
        if (indexInLastName !== -1) {
          // Letra correcta en posición incorrecta
          tile.classList.add("wrong-position")
          // Marcar esta letra como ya verificada
          lastNameArray[indexInLastName] = null
        } else {
          // Letra incorrecta
          tile.classList.add("incorrect")
        }
      }
  
      // Actualizar el teclado con las letras usadas
      updateKeyboard(row)
  
      // Verificar si la palabra es correcta
      if (word === selectedLastName) {
        gameCompleted = true
  
        setTimeout(async () => {
          // Verificar si el usuario está autenticado para sumar puntos
        if (typeof window.completeGame === "function") {
            await window.completeGame(1) // Juego 1 completado
        }
        }, 500)
        return true
      }
  
      return false
    }
      
  
    // Función para manejar cuando se presiona una tecla de letra
    function handleLetterKey(letter) {
      if (gameCompleted) return // No permitir más entradas si el juego está completado
  
      if (gameState.currentCol < gameState.maxLength) {
        gameState.grid[gameState.currentRow][gameState.currentCol] = letter
        gameState.currentCol++
        updateGridDisplay()
      }
    }
  
    // Función para manejar cuando se presiona la tecla de retroceso
    function handleBackspace() {
      if (gameCompleted) return // No permitir más entradas si el juego está completado
  
      if (gameState.currentCol > 0) {
        gameState.currentCol--
        gameState.grid[gameState.currentRow][gameState.currentCol] = ""
        updateGridDisplay()
      }
    }
  
    // Función para manejar cuando se presiona la tecla Enter
    function handleEnter() {
      if (gameCompleted) return // No permitir más entradas si el juego está completado
  
      // Solo permitir Enter si la fila está completa
      if (gameState.currentCol === gameState.maxLength) {
        // Verificar la palabra
        const isCorrect = checkWord(gameState.currentRow)
  
        // Si no es correcta y no es la última fila, pasar a la siguiente
        if (!isCorrect) {
          if (gameState.currentRow < 5) {
            gameState.currentRow++
            gameState.currentCol = 0
          } else {
            // Juego terminado, sin más intentos
            gameCompleted = true
            setTimeout(() => {
              alert("¡Juego terminado! El apellido correcto era: " + selectedLastName.toUpperCase())
              resetGame()
            }, 500)
          }
        }
      } else {
        alert(`La palabra debe tener ${gameState.maxLength} letras`)
      }
    }
  
    // Función para reiniciar el juego
    async function resetGame() {
      // Limpiar las clases del teclado
      const keyButtons = document.querySelectorAll(".key")
      keyButtons.forEach((button) => {
        button.classList.remove("key-correct", "key-wrong-position", "key-incorrect")
      })
  
      gameCompleted = false
      await getRandomPlayer()
      updateGridDisplay()
    }
  
    // Agregar event listeners a los botones del teclado virtual
    function setupKeyboardListeners() {
      const keyButtons = document.querySelectorAll(".key")
  
      keyButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const keyValue = button.textContent.toLowerCase()
  
          if (keyValue === "enter") {
            handleEnter()
          } else if (keyValue === "bksp") {
            handleBackspace()
          } else {
            handleLetterKey(keyValue)
          }
        })
      })
  
      // Permitir el uso del teclado físico
      document.addEventListener("keydown", (event) => {
        const key = event.key.toLowerCase()
  
        if (key === "enter") {
          handleEnter()
        } else if (key === "backspace") {
          handleBackspace()
        } else if (/^[a-zñ]$/.test(key)) {
          handleLetterKey(key)
        }
      })
    }
  
    // Inicializar el juego
    async function initGame() {
      try {
        // Obtener un jugador aleatorio
        await getRandomPlayer()
  
        // Configurar los listeners del teclado
        setupKeyboardListeners()
  
        // Actualizar la visualización inicial
        updateGridDisplay()
      } catch (error) {
        console.error("Error al inicializar el juego:", error)
        alert("Error al inicializar el juego. Por favor, recarga la página.")
      }
    }
  
    // Iniciar el juego
    initGame()
  })
  