document.addEventListener("DOMContentLoaded", () => {
  // Función para manejar el clic en botones deshabilitados
  const disabledButtons = document.querySelectorAll(".play-button.disabled")

  disabledButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault()
      alert("Este juego estará disponible próximamente. ¡Vuelve pronto!")
    })
  })

  // Crear imágenes de placeholder si no existen
  function createPlaceholderIfNeeded() {
    const thumbnails = document.querySelectorAll(".game-thumbnail img")

    thumbnails.forEach((img) => {
      img.onerror = function () {
        // Si la imagen no se puede cargar, usar un color de fondo
        const gameCard = this.closest(".game-card")
        const thumbnail = this.closest(".game-thumbnail")

        if (gameCard && thumbnail) {
          // Determinar qué juego es basado en el título
          const title = gameCard.querySelector("h3").textContent

          if (title.includes("FUTBOL11")) {
            thumbnail.style.backgroundColor = "#d91023" // Rojo para FUTBOL11
            this.style.display = "none" // Ocultar la imagen

            // Crear un elemento de texto para mostrar el título
            const textPlaceholder = document.createElement("div")
            textPlaceholder.className = "text-placeholder"
            textPlaceholder.textContent = "FUTBOL11"
            textPlaceholder.style.color = "white"
            textPlaceholder.style.fontWeight = "bold"
            textPlaceholder.style.fontSize = "24px"
            textPlaceholder.style.display = "flex"
            textPlaceholder.style.alignItems = "center"
            textPlaceholder.style.justifyContent = "center"
            textPlaceholder.style.height = "100%"

            thumbnail.appendChild(textPlaceholder)
          } else {
            thumbnail.style.backgroundColor = "#3a3a3c" // Gris para próximamente
            this.style.display = "none"

            const textPlaceholder = document.createElement("div")
            textPlaceholder.className = "text-placeholder"
            textPlaceholder.textContent = "Próximamente"
            textPlaceholder.style.color = "white"
            textPlaceholder.style.fontWeight = "bold"
            textPlaceholder.style.fontSize = "20px"
            textPlaceholder.style.display = "flex"
            textPlaceholder.style.alignItems = "center"
            textPlaceholder.style.justifyContent = "center"
            textPlaceholder.style.height = "100%"

            thumbnail.appendChild(textPlaceholder)
          }
        }
      }

      // Forzar la comprobación de la imagen
      const currentSrc = img.src
      img.src = ""
      img.src = currentSrc
    })
  }

  // Ejecutar la función después de que todo esté cargado
  window.addEventListener("load", createPlaceholderIfNeeded)
})
