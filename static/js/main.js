function iconFix(x) {
    x.classList.toggle("change");
}

function menuFix() {
    var x = document.getElementsByClassName("men")[0];
    var con = document.getElementById('con');
    if (x.className === "men") {
        x.className += " responsive";
        x.style.display = 'inline-block';
        con.style.display = 'none';
    } else {
        x.style.display = 'none'
        x.className = 'men';
        con.style.display = 'block';
    }
}