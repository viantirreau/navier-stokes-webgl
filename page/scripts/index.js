const toggleButtons = (buttons, id) => {
  buttons.each((_, button) => {
    if ($(button).attr("to") !== id) {
      $(button).removeClass("is-active")
    } else {
      $(button).addClass("is-active")
    }
  })
}

setTimeout(() => $(document).ready(() => {
  // Check for click events on the navbar burger icon
  $(".navbar-burger").click(() => {

      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      $(".navbar-burger").toggleClass("is-active");
      $(".navbar-menu").toggleClass("is-active");
  });

  const navButtons = $(".navbar-menu > div > a")
  navButtons.each((_, button) => {
    const to = $(button).attr("to")

    $(button).click((event) => {
      event.preventDefault()

      window.scroll({
        top: $(to).position().top - $("nav").height(),
        left: 0,
        behavior: "smooth"
      })
    })

    $(window).on('scroll', () => {
      const yScrollPos = window.pageYOffset;
      const scrollPosTest = $(to).position().top - $("nav").height() - 1;
  
      if (yScrollPos > scrollPosTest) {
        toggleButtons(navButtons, to)
      }
  });
  })

  const images = $(".card-image")
  images.each((_, image) => {
    const message = $("#" + $(image).attr("message"))

    if (message.length) {
      $(image).click(() => message.addClass("is-active"))
    }; 
  })

  $(".modal > .modal-background").click((event) => $(event.target).parent().removeClass("is-active"))
  $(".modal > button").click((event) => $(event.target).parent().removeClass("is-active"))
}), 1000)
