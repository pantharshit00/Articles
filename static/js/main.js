function iconFix(x) {
    x.classList.toggle("change");
}

function menuFix() {
    var x = document.getElementsByClassName("men")[0];
    if (x.className === "men") {
        x.className += " responsive";
        x.style.display = 'inline-block';
    } else {
        x.style.display = 'none'
        x.className = 'men';
    }
}