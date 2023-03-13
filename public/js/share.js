function shareOnFacebook(slug) {
  var curl = encodeURIComponent("https://"+getDomain()+slug);
  window.open('https://www.facebook.com/sharer/sharer.php?u=' + curl, '_blank', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no, width=600,height=600');
  return false;
}
function shareOnTwitter(slug, title) {
  var curl = encodeURIComponent("https://"+getDomain()+slug);
    var o = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {
            via: "_arcadestudio_"
        },
        r = 800,
        n = 400,
        a = window.screen.width / 2 - r / 2,
        i = window.screen.height / 2 - n / 2,
        s = "https://twitter.com/intent/tweet?url=" + curl + "&text=" + encodeURIComponent(title);
    Object.prototype.hasOwnProperty.call(o, "via") && null !== o.via && (s += "&via=" + o.via);
    var l = window.open(s, "_blank", "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=" + r + ", height=" + n);
    l && l.moveTo(a, i)
}
function shareOnPinterest(slug, description, imageUrl) {
  var curl = encodeURIComponent("https://"+getDomain()+slug);
    var posx = window.screen.width / 2 - 390,
        posy = window.screen.height / 2 - 200,
        shareUrl = "http://pinterest.com/pin/create/button/?url=" + curl + "&description=" + encodeURIComponent(description) + "&media=" + encodeURIComponent(imageUrl),
        newWindow = window.open(shareUrl, "_blank", "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=780, height=400");
    newWindow && newWindow.moveTo(posx, posy)
}
function shareOnReddit(slug, title) {
    var curl = encodeURIComponent("https://"+getDomain()+slug);
    var o = "https://www.reddit.com/submit?url=" + curl + "&title=" + encodeURIComponent(title);
    window.open(o, "_blank")
}
function shareOnLinkedin(slug, title,summary) {
  var curl = ("https://"+getDomain()+slug);
    var nw='https://www.linkedin.com/shareArticle?mini=true&url='+curl+'&title='+title+'&summary='+summary+'&source=LinkedIn'

    var t = window.screen.width / 2 - 300,
        o = window.screen.height / 2 - 235,
        n = window.open(nw, "_blank", "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=600, height=470");
    n && n.moveTo(t, o)
}

function getMailTo(subject,body) {
    return "mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body)
}

function getDomain(){

  return "arcade.studio";
  var t1 = window.location.href.split("/");
  return t1[2];
}
