document.addEventListener("DOMContentLoaded", () => {
    // Función para actualizar el contador de tiempo hasta medianoche
    function updateCountdown() {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
  
      const timeRemaining = tomorrow - now
  
      // Calcular horas, minutos y segundos
      const hours = Math.floor(timeRemaining / (1000 * 60 * 60))
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000)
  
      // Formatear con ceros a la izquierda
      const formattedHours = String(hours).padStart(2, "0")
      const formattedMinutes = String(minutes).padStart(2, "0")
      const formattedSeconds = String(seconds).padStart(2, "0")
  
      // Actualizar el elemento del contador
      const countdownElement = document.getElementById("countdown-timer")
      if (countdownElement) {
        countdownElement.textContent = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
      }
    }
  
    // Función para ajustar dinámicamente la posición del logo
    function adjustLogoPosition() {
      const header = document.querySelector(".logo-container")
      const logoWrapper = document.querySelector(".logo-wrapper")
      const countdown = document.querySelector(".countdown-container")
      const headerRight = document.querySelector(".header-right")
  
      // Solo ajustar en pantallas más grandes donde el logo está centrado absolutamente
      if (window.innerWidth > 768) {
        // Obtener anchos
        const headerWidth = header.offsetWidth
        const logoWidth = logoWrapper.offsetWidth
        const countdownWidth = countdown.offsetWidth
        const headerRightWidth = headerRight.offsetWidth
  
        // Calcular el espacio disponible
        const availableSpace = headerWidth - countdownWidth - headerRightWidth
  
        // Verificar si hay suficiente espacio para el logo
        if (logoWidth > availableSpace) {
          // Si no hay suficiente espacio, ajustar el tamaño de fuente del logo
          const currentFontSize = Number.parseInt(window.getComputedStyle(logoWrapper.querySelector(".logo")).fontSize)
          const newFontSize = currentFontSize * (availableSpace / logoWidth) * 0.9 // Factor de seguridad
          logoWrapper.querySelector(".logo").style.fontSize = `${newFontSize}px`
        }
  
        // Asegurarse de que el logo no se superponga con otros elementos
        const logoLeft = (headerWidth - logoWrapper.offsetWidth) / 2
        const minLeftSpace = countdownWidth + 20 // 20px de margen
        const maxRightSpace = headerWidth - headerRightWidth - 20 // 20px de margen
  
        if (logoLeft < minLeftSpace) {
          logoWrapper.style.left = `${minLeftSpace}px`
          logoWrapper.style.transform = "none"
        } else if (logoLeft + logoWrapper.offsetWidth > maxRightSpace) {
          logoWrapper.style.left = `${maxRightSpace - logoWrapper.offsetWidth}px`
          logoWrapper.style.transform = "none"
        } else {
          // Restaurar la posición centrada
          logoWrapper.style.left = "50%"
          logoWrapper.style.transform = "translateX(-50%)"
        }
      } else {
        // Restaurar estilos para móviles
        logoWrapper.style.left = ""
        logoWrapper.style.transform = ""
        logoWrapper.querySelector(".logo").style.fontSize = ""
      }
    }
  
    // Animación para el logo
    const logo = document.querySelector(".logo")
    if (logo) {
      logo.addEventListener("mouseover", function () {
        this.style.transform = "scale(1.05)"
        this.style.transition = "transform 0.3s ease"
      })
  
      logo.addEventListener("mouseout", function () {
        this.style.transform = "scale(1)"
      })
    }
  
    // Actualizar el contador inmediatamente y luego cada segundo
    updateCountdown()
    setInterval(updateCountdown, 1000)
  
    // Ejecutar al cargar y cuando cambie el tamaño de la ventana
    adjustLogoPosition()
    window.addEventListener("resize", adjustLogoPosition)
  })
  