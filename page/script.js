const toggleButtons = (buttons, id) => {
  buttons.each((_, button) => {
    if ($(button).attr("to") !== id) {
      $(button).removeClass("is-active")
    } else {
      $(button).addClass("is-active")
    }
  })
}

$(document).ready(() => {
  // Check for click events on the navbar burger icon
  $(".navbar-burger").click(() => {

      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      $(".navbar-burger").toggleClass("is-active");
      $(".navbar-menu").toggleClass("is-active");
  });

  const buttons = $(".navbar-menu > div > a")
  buttons.each((_, button) => {
    const to = $(button).attr("to")

    $(button).click((event) => {
      event.preventDefault()

      // toggleButtons(buttons, to)
      window.scroll({
        top: $(to).position().top - $("nav").height(),
        left: 0,
        behavior: "smooth"
      })
    })

    $(window).on('scroll', () => {
      const yScrollPos = window.pageYOffset;
      const scrollPosTest = $(to).position().top - $("nav").height() - 1;
  
      if (yScrollPos > scrollPosTest || $(window).scrollTop() + window.innerHeight === $(document).height()) {
        toggleButtons(buttons, to)
      }
  });
  })


});

