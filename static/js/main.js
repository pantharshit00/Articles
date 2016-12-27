function iconFix(x) {
    x.classList.toggle("change");
}

function menuFix() {
    var x = document.getElementsByClassName("men")[0];
    var con = document.getElementById('con');
    var foot = document.getElementsByTagName('footer')[0];
    if (x.className === "men") {
        x.className += " responsive";
        x.style.display = 'inline-block';
        con.style.display = 'none';
        foot.style.display = 'none';
    } else {
        x.style.display = 'none'
        x.className = 'men';
        con.style.display = 'block';
        foot.style.display = 'block';
    }
}
