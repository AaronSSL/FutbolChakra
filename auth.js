// Sistema de autenticación para FUTBOL11
const SUPABASE_URL = "https://bbldcocvxmzztvkaowbd.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibGRjb2N2eG16enR2a2Fvd2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1NDc5NDgsImV4cCI6MjA1OTEyMzk0OH0.JILUByfv8ZM1BiEjkmb0uDOd7e3m-MtgDW8XfC9FkRg"

// Inicializar el cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Estado global de autenticación
const authState = {
  isLoggedIn: false,
  currentUser: null,
  userPoints: 0,
  gamesPlayed: {
    juego1: false,
    juego2: false,
  },
}

// Función para verificar si el usuario está autenticado al cargar la página
async function checkAuthStatus() {
  try {
    // Verificar si hay un usuario en localStorage
    const storedUser = localStorage.getItem("futbol11_user")

    if (storedUser) {
      const userData = JSON.parse(storedUser)

      // Verificar si el usuario existe en la base de datos
      const { data, error } = await supabase.from("usuario").select("*").eq("username", userData.username).single()

      if (error) {
        console.error("Error al verificar usuario:", error)
        logout() // Limpiar datos incorrectos
        return false
      }

      if (data) {
        // Usuario verificado, actualizar estado
        authState.isLoggedIn = true
        authState.currentUser = data
        authState.userPoints = data.puntos
        authState.gamesPlayed = {
          juego1: data.juego1,
          juego2: data.juego2,
        }

        // Actualizar UI
        updateAuthUI()
        return true
      }
    }

    return false
  } catch (error) {
    console.error("Error al verificar autenticación:", error)
    return false
  }
}

// Función para registrar un nuevo usuario
async function registerUser(username, password) {
  try {
    if (!username || !password) {
      showMessage("Por favor, completa todos los campos", "error")
      return false
    }

    // Verificar si el usuario ya existe
    const { data: existingUser, error: checkError } = await supabase
      .from("usuario")
      .select("username")
      .eq("username", username)
      .single()

    if (existingUser) {
      showMessage("Este nombre de usuario ya está registrado", "error")
      return false
    }

    // Crear nuevo usuario
    const { data, error } = await supabase
      .from("usuario")
      .insert([
        {
          username,
          password, // Nota: En producción, deberías hashear la contrase��a
          juego1: false,
          juego2: false,
          puntos: 0,
        },
      ])
      .select()

    if (error) {
      console.error("Error al registrar usuario:", error)
      showMessage("Error al registrar usuario", "error")
      return false
    }

    showMessage("Usuario registrado correctamente", "success")

    // Cerrar el modal
    closeAuthModal()

    // Iniciar sesión automáticamente
    return await loginUser(username, password)
  } catch (error) {
    console.error("Error en el registro:", error)
    showMessage("Error en el registro", "error")
    return false
  }
}

// Función para iniciar sesión
async function loginUser(username, password) {
  try {
    if (!username || !password) {
      showMessage("Por favor, completa todos los campos", "error")
      return false
    }

    const { data, error } = await supabase
      .from("usuario")
      .select("*")
      .eq("username", username)
      .eq("password", password) // Nota: En producción, deberías verificar el hash
      .single()

    if (error || !data) {
      console.error("Error al iniciar sesión:", error)
      showMessage("Nombre de usuario o contraseña incorrectos", "error")
      return false
    }

    // Guardar usuario en localStorage
    localStorage.setItem(
      "futbol11_user",
      JSON.stringify({
        username: data.username,
        id: data.id_usuario,
      }),
    )

    // Actualizar estado
    authState.isLoggedIn = true
    authState.currentUser = data
    authState.userPoints = data.puntos
    authState.gamesPlayed = {
      juego1: data.juego1,
      juego2: data.juego2,
    }

    // Cerrar el modal
    closeAuthModal()

    // Actualizar UI
    updateAuthUI()
    showMessage("Sesión iniciada correctamente", "success")

    return true
  } catch (error) {
    console.error("Error al iniciar sesión:", error)
    showMessage("Error al iniciar sesión", "error")
    return false
  }
}

// Función para cerrar sesión
function logout() {
  // Limpiar localStorage
  localStorage.removeItem("futbol11_user")

  // Resetear estado
  authState.isLoggedIn = false
  authState.currentUser = null
  authState.userPoints = 0
  authState.gamesPlayed = {
    juego1: false,
    juego2: false,
  }

  // Actualizar UI
  updateAuthUI()
  updateGameAvailability() 
  showMessage("Sesión cerrada")
}

// Función para actualizar la interfaz según el estado de autenticación
function updateAuthUI() {
  const loginButton = document.getElementById("login-button")
  const registerButton = document.getElementById("register-button")
  const userBar = document.getElementById("user-bar")
  const userBarUsername = document.getElementById("user-bar-username")
  const userBarPoints = document.getElementById("user-bar-points-value")

  if (authState.isLoggedIn && authState.currentUser) {
    // Usuario autenticado
    if (loginButton) loginButton.style.display = "none"
    if (registerButton) registerButton.style.display = "none"

    // Mostrar barra de usuario
    if (userBar) {
      userBar.style.display = "flex"
      if (userBarUsername) userBarUsername.textContent = authState.currentUser.username
      if (userBarPoints) userBarPoints.textContent = authState.userPoints
    }

    // Actualizar estado de los juegos
    updateGameAvailability()
  } else {
    // Usuario no autenticado
    if (loginButton) loginButton.style.display = "block"
    if (registerButton) registerButton.style.display = "block"
    if (userBar) userBar.style.display = "none"
  }
}

const screenHeight = window.innerHeight
// Función para mostrar mensajes al usuario
function showMessage(message, type = "info") {
    let messageContainer = document.getElementById("message-container")
  
    if (!messageContainer) {
      // Crear contenedor de mensajes si no existe
      messageContainer = document.createElement("div")
      messageContainer.id = "message-container"
      document.body.appendChild(messageContainer)
  
      // Aplicar estilos
      messageContainer.style.position = "fixed"
      messageContainer.style.top = (screenHeight - 110) + "px"
      messageContainer.style.right = "20px"
      messageContainer.style.zIndex = "1000"
    }
  
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
        messageElement.style.color = "white"
        break
      case "warning":
        messageElement.style.backgroundColor = "#FF9800"
        messageElement.style.color = "white"
        break
      default:
        messageElement.style.backgroundColor = "#2196F3"
        messageElement.style.color = "white"
    }
  
    messageContainer.appendChild(messageElement)
  
    // Eliminar mensaje después de 3 segundos
    setTimeout(() => {
      messageElement.remove()
    }, 3000)
  }
  

// Función para actualizar la disponibilidad de los juegos
function updateGameAvailability() {
    const juego1Button = document.querySelector('a[href="index.html"]')
    const juego2Button = document.querySelector('a[href="index2.html"]')
    if (!authState.isLoggedIn) {
        juego1Button.textContent = "JUGAR"
        juego1Button.style.setProperty("background-color", "#d91023", "important")
        juego1Button.style.color = "white"
        juego1Button.style.cursor = "pointer"
        juego1Button.classList.remove("game-played") // Por si estaba en gris
        juego2Button.textContent = "JUGAR"
        juego2Button.style.setProperty("background-color", "#d91023", "important")
        juego2Button.style.color = "white"
        juego2Button.style.cursor = "pointer"
        juego2Button.classList.remove("game-played") // Por si estaba en gris
        return
      }
  // Juego 1 (Wordle)
  //const juego1Button = document.querySelector('a[href="index.html"]')
    if (juego1Button && authState.gamesPlayed.juego1) {
    juego1Button.classList.add("game-played")
    juego1Button.textContent = "JUGADO"
    juego1Button.style.backgroundColor = "#3a3a3c"
    juego1Button.style.cursor = "not-allowed"

    // Prevenir navegación
    juego1Button.addEventListener("click", (e) => {
      if (authState.gamesPlayed.juego1) {
        e.preventDefault()
        showMessage("Ya has jugado este juego hoy", "warning")
      }
    })
  }

  // Juego 2 (Grid)
  if (juego2Button && authState.gamesPlayed.juego2) {
    juego2Button.classList.add("game-played")
    juego2Button.textContent = "JUGADO"
    juego2Button.style.backgroundColor = "#3a3a3c"
    juego2Button.style.cursor = "not-allowed"

    // Prevenir navegación
    juego2Button.addEventListener("click", (e) => {
      if (authState.gamesPlayed.juego2) {
        e.preventDefault()
        showMessage("Ya has jugado este juego hoy", "warning")
      }
    })
  }
}

function showCompletionModal2() {
    // Crear fondo del modal
    const modalOverlay = document.createElement("div")
    modalOverlay.style.position = "fixed"
    modalOverlay.style.top = "0"
    modalOverlay.style.left = "0"
    modalOverlay.style.width = "100%"
    modalOverlay.style.height = "100%"
    modalOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)"
    modalOverlay.style.display = "flex"
    modalOverlay.style.alignItems = "center"
    modalOverlay.style.justifyContent = "center"
    modalOverlay.style.zIndex = "2000"

    // Crear contenedor del modal
    const modal = document.createElement("div")
    modal.style.backgroundColor = "#fff"
    modal.style.padding = "40px 30px"
    modal.style.borderRadius = "12px"
    modal.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.2)"
    modal.style.position = "relative"
    modal.style.maxWidth = "450px"
    modal.style.textAlign = "center"
    modal.style.fontFamily = "Arial, sans-serif"

    // Botón "X" para cerrar
    const closeButton = document.createElement("span")
    closeButton.textContent = "×"
    closeButton.style.position = "absolute"
    closeButton.style.top = "12px"
    closeButton.style.right = "18px"
    closeButton.style.fontSize = "24px"
    closeButton.style.cursor = "pointer"
    closeButton.style.fontWeight = "bold"
    closeButton.style.color = "#bbb"
    closeButton.style.transition = "color 0.2s"

    closeButton.addEventListener("mouseenter", () => {
    closeButton.style.color = "#000"
    })
    closeButton.addEventListener("mouseleave", () => {
    closeButton.style.color = "#bbb"
    })
    closeButton.addEventListener("click", () => {
    modalOverlay.remove()
    })

    // Título
    const title = document.createElement("h2")
    title.textContent = "¡JUEGO COMPLETADO!"
    title.style.marginBottom = "20px"
    title.style.fontSize = "24px"
    title.style.color = "#333"
    title.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    title.style.letterSpacing = "1px"
    title.style.fontWeight = "700"

    // Mensaje con separación de líneas
    const message = document.createElement("div")
    message.innerHTML = `
    <p style="margin-bottom: 12px; font-size: 16px;">
        <strong>Registrate para competir por premios.</strong>
    </p>
    <p style="margin: 0; font-size: 16px;">
        Ve al siguente juego.
    </p>
    `

    // Botón de continuar
    const continueBtn = document.createElement("button")
    continueBtn.textContent = "Seguir jugando"
    continueBtn.style.marginTop = "25px"
    continueBtn.style.padding = "12px 24px"
    continueBtn.style.border = "none"
    continueBtn.style.borderRadius = "8px"
    continueBtn.style.backgroundColor = "#4CAF50"
    continueBtn.style.color = "white"
    continueBtn.style.fontWeight = "bold"
    continueBtn.style.fontSize = "16px"
    continueBtn.style.cursor = "pointer"
    continueBtn.style.transition = "background-color 0.2s"

    continueBtn.addEventListener("mouseenter", () => {
    continueBtn.style.backgroundColor = "#45a049"
    })
    continueBtn.addEventListener("mouseleave", () => {
    continueBtn.style.backgroundColor = "#4CAF50"
    })
    continueBtn.addEventListener("click", () => {
    window.location.href = "Inicio.html"
    })

    // Agregar elementos al modal
    modal.appendChild(closeButton)
    modal.appendChild(title)
    modal.appendChild(message)
    modal.appendChild(continueBtn)
    modalOverlay.appendChild(modal)
    document.body.appendChild(modalOverlay)
}
function showCompletionModal() {
    // Evitar duplicados
    if (document.getElementById("completion-modal")) return
  
    // Crear contenedor del modal
    const modal = document.createElement("div")
    modal.id = "completion-modal"
    modal.style.position = "fixed"
    modal.style.top = "50%"
    modal.style.left = "50%"
    modal.style.transform = "translate(-50%, -50%)"
    modal.style.backgroundColor = "#fff"
    modal.style.padding = "30px"
    modal.style.borderRadius = "10px"
    modal.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)"
    modal.style.zIndex = "2000"
    modal.style.textAlign = "center"
    modal.style.maxWidth = "300px"
    modal.style.fontFamily = "Arial, sans-serif"
  
    // Contenido del modal
    modal.innerHTML = `
        <h2 style="margin-bottom: 10px; color: #4CAF50; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        JUEGO COMPLETADO
        </h2>

        <p style="margin-bottom: 20px;">Has ganado <strong>50 puntos</strong>.<br>Ahora ve al siguiente juego para seguir ganando puntos.</p>
        <button id="continue-btn" style="
            padding: 10px 20px;
            background-color: #2196F3;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        ">
            Seguir jugando
        </button>
        `
  
    document.body.appendChild(modal)
  
    // Acción del botón
    document.getElementById("continue-btn").addEventListener("click", () => {
      window.location.href = "Inicio.html" // Ajustá la ruta si tu inicio está en otra
    })
}

// Función para registrar que un juego ha sido completado
async function completeGame(gameNumber) {
  if (!authState.isLoggedIn || !authState.currentUser) {
    // Usuario no autenticado, no registrar puntos
    showCompletionModal2()
    return
  }

  // Verificar si ya jugó este juego
  const gameField = `juego${gameNumber}`
  if (authState.gamesPlayed[gameField]) {
    showMessage("Ya has completado este juego", "warning")
    return false
  }

  try {
    // Actualizar en la base de datos
    const { data, error } = await supabase
      .from("usuario")
      .update({
        [gameField]: true,
        puntos: authState.userPoints + 50, // Sumar 50 puntos
      })
      .eq("id_usuario", authState.currentUser.id_usuario)
      .select()

    if (error) {
      console.error("Error al actualizar puntos:", error)
      showMessage("Error al registrar puntos", "error")
      return false
    }

    // Actualizar estado local
    authState.gamesPlayed[gameField] = true
    authState.userPoints += 50

    // Actualizar UI
    updateAuthUI()
    showMessage("¡Has ganado 50 puntos!", "success")
    showCompletionModal()

    return true
  } catch (error) {
    console.error("Error al completar juego:", error)
    showMessage("Error al registrar puntos", "error")
    return false
  }
}

// Función para cargar la tabla de clasificación
async function loadLeaderboard() {
  const leaderboardContainer = document.getElementById("leaderboard-container")
  if (!leaderboardContainer) return

  try {
    // Obtener los usuarios ordenados por puntos
    const { data, error } = await supabase
      .from("usuario")
      .select("username, puntos")
      .order("puntos", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error al cargar clasificación:", error)
      return
    }

    // Limpiar contenedor
    leaderboardContainer.innerHTML = ""

    // Crear tabla
    const table = document.createElement("table")
    table.className = "leaderboard-table"
    table.style.width = "100%"
    table.style.borderCollapse = "collapse"

    // Crear encabezado
    const thead = document.createElement("thead")
    const headerRow = document.createElement("tr")

    const rankHeader = document.createElement("th")
    rankHeader.textContent = "#"
    rankHeader.style.width = "30px"
    rankHeader.style.textAlign = "center"

    const usernameHeader = document.createElement("th")
    usernameHeader.textContent = "Usuario"
    usernameHeader.style.textAlign = "left"

    const pointsHeader = document.createElement("th")
    pointsHeader.textContent = "Pts"
    pointsHeader.style.width = "40px"
    pointsHeader.style.textAlign = "center"

    headerRow.appendChild(rankHeader)
    headerRow.appendChild(usernameHeader)
    headerRow.appendChild(pointsHeader)
    thead.appendChild(headerRow)
    table.appendChild(thead)

    // Crear cuerpo de la tabla
    const tbody = document.createElement("tbody")

    data.forEach((user, index) => {
      const row = document.createElement("tr")

      // Alternar colores de fondo
      if (index % 2 === 0) {
        row.style.backgroundColor = "#f2f2f2"
      }

      // Resaltar usuario actual
      if (authState.isLoggedIn && authState.currentUser && user.username === authState.currentUser.username) {
        row.style.backgroundColor = "#ffe0e0"
        row.style.fontWeight = "bold"
      }

      const rankCell = document.createElement("td")
      rankCell.textContent = index + 1
      rankCell.style.textAlign = "center"

      const usernameCell = document.createElement("td")
      usernameCell.textContent = user.username

      const pointsCell = document.createElement("td")
      pointsCell.textContent = user.puntos
      pointsCell.style.textAlign = "center"

      row.appendChild(rankCell)
      row.appendChild(usernameCell)
      row.appendChild(pointsCell)
      tbody.appendChild(row)
    })

    table.appendChild(tbody)
    leaderboardContainer.appendChild(table)
  } catch (error) {
    console.error("Error al cargar la tabla de clasificación:", error)
  }
}

// Funciones para manejar el modal de autenticación
function openAuthModal(formType) {
  const modal = document.getElementById("auth-modal")
  const loginForm = document.getElementById("login-form")
  const registerForm = document.getElementById("register-form")

  if (modal) {
    modal.style.display = "block"

    // Mostrar el formulario correspondiente
    if (formType === "login") {
      loginForm.style.display = "block"
      registerForm.style.display = "none"
    } else {
      loginForm.style.display = "none"
      registerForm.style.display = "block"
    }
  }
}

function closeAuthModal() {
  const modal = document.getElementById("auth-modal")
  if (modal) {
    modal.style.display = "none"
  }
}

// Inicializar autenticación cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  // Verificar estado de autenticación
  checkAuthStatus()

  // Configurar botones de autenticación
  const loginButton = document.getElementById("login-button")
  const registerButton = document.getElementById("register-button")
  const closeModalButton = document.querySelector(".close-modal")

  if (loginButton) {
    loginButton.addEventListener("click", () => openAuthModal("login"))
  }

  if (registerButton) {
    registerButton.addEventListener("click", () => openAuthModal("register"))
  }

  if (closeModalButton) {
    closeModalButton.addEventListener("click", closeAuthModal)
  }

  // Cerrar modal al hacer clic fuera del contenido
  window.addEventListener("click", (event) => {
    const modal = document.getElementById("auth-modal")
    if (event.target === modal) {
      closeAuthModal()
    }
  })

  // Cargar tabla de clasificación si estamos en la página principal
  if (document.getElementById("leaderboard-container")) {
    loadLeaderboard()
  }

  // Exponer la función completeGame globalmente para que los juegos puedan usarla
  window.completeGame = completeGame
})
