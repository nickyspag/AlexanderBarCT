$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};
var customertoken;
if (localStorage.getItem('customertoken')) {
    customertoken = localStorage.getItem('customertoken');
}
jQuery.validator.addMethod('luhnCheck', function(value) {
    if (value=='comp') return true;
    var luhnArr = [[0,2,4,6,8,1,3,5,7,9],[0,1,2,3,4,5,6,7,8,9]], sum = 0;
    value.replace(/\D+/g,"").replace(/[\d]/g, function(c, p, o){
        sum += luhnArr[ (o.length-p)&1 ][ parseInt(c,10) ];
    });
    return (sum%10 === 0) && (sum > 0);
}, 'Please enter a valid credit card number without any spaces');

function api(f, d, e, m) {
    d = d || {};
    e = e || {};
    if (!m) m = 'GET';
    if ($.isArray(f)) f = f.join('/');
    if (localStorage.getItem('encUsername')) {
        d.encUsername=localStorage.getItem('encUsername');
        d.encPassword=localStorage.getItem('encPassword');
    }
    if (window.location.hostname.indexOf('tincap')>=0) {
        e.url = 'http://api.glasstop.tincap.nitric.co.za/alexapi/'+f;    
    } 
    else if (window.location.hostname.indexOf('localhost')>=0) {
        e.url = 'http://api.glasstop.localhost/alexapi/'+f;    
    } 
    else {
        e.url = 'https://alexanderbar.co.za/api/alexapi/'+f;    
    }
    if (customertoken) e.headers = {'X-customertoken': customertoken}
    e.data = d;
    e.method = m;
    return $.ajax(e);
}
function apipost(f,d,e) {
    return api(f,d,e,'POST');
}
function errhandle(xhr) {
    //$('.alert-danger').remove();
    alert(xhr.responseJSON||'Unknown Error');
    //return danger(xhr.responseJSON);
}
function danger(msg) {
    return $('<div class="alert alert-danger alert-dismissable"> <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button> <strong>'+msg+'</strong></div>').insertAfter('.page-header');
}
function success(msg) {
    return $('<div class="alert alert-success alert-dismissable"> <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button> <strong>'+msg+'</strong></div>').insertAfter('.page-header');
}
function warning(msg) {
    return $('<div class="alert alert-warning alert-dismissable"> <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button> <strong>'+msg+'</strong></div>').insertAfter('.page-header');
}
function onlyonepage(w) {
    $('div.page').not(w).hide();
    $(w).show();
}

$(document).on('ready', function() {

    $('#theme').on('change', function() {
        localStorage.setItem('theme', $(this).val());
        $('#bootstrap').prop('href', 'css/themes/'+$(this).val()+'.min.css');
    });

    function updatedetail() {
        api('detail',{},{async:false}).then(function(d) {
            localStorage.setItem('detail', JSON.stringify(d));
            $('#persian').trigger('show');
        }, errhandle);
    }

    $('#loginform').validate({errorClass:'text-danger', submitHandler: function(form,evt) {
        var vals = $('#loginform').serializeObject();
        apipost('login', {'customer_code': vals.customer_code, 'password': vals.password}).then(function(d) {
            customertoken=d.token;
            localStorage.setItem('customertoken', d.token);
            updatedetail();
        }, function() { 
            alert('Login failed - please check your number and password');
        });
    }});


    $(document).on('show', '#loginpage', function() {
        onlyonepage(this);
    });

    $(document).on('show', '#persian', function() {
        onlyonepage(this);
        if (!localStorage.getItem('detail')) updatedetail();
        var detail=JSON.parse(localStorage.getItem('detail'));
        $('#customer_name').text(detail.firstname||detail.customer_name);
        api('getflorinbalance').then(function(d) {
            $('#florins').text(d['florins']);
        }, errhandle);
        api('getopentables').then(function(d) {
            $('#open').text(d['total']);
        }, errhandle);
    });

    $('#whatsplaying').on('click', function() {
        $('#whatsplayingmodal .modal-body').html('<p>Loading...</p>');
        api('whatsplaying').then(function(d) {
            var t=new Date();
            $('#whatsplayingmodal .modal-title small').text(t.getHours()+':'+t.getMinutes());
            $('#whatsplayingmodal .modal-body').empty().append([
                $('<dt />', {text: 'title'}),
                $('<dd />', {text: d.title}),
                $('<dt />', {text: 'artist'}),
                $('<dd />', {text: d.artist}),
                $('<dt />', {text: 'album'}),
                $('<dd />', {text: d.album}),
                $('<button />', {"class": "btn btn-warning btn-md", "text": "Next Track", "id": "nexttrack"})
            ]);
        }, errhandle);
    });
    $('#whatsplayingmodal').on('click', '#nexttrack', function() {
        apipost("nexttrack").then(function() {
            $('#whatsplaying').trigger('click');
        });
    });

    var shows=[];
    var s;
    var now=new Date();
    if (localStorage.getItem('lastshowupdate')) {
        s=new Date(localStorage.getItem('lastshowupdate'));
    }
    if (!localStorage.getItem('shows')||s.getTime()<(now.getTime()-3600*1000)) {
        api("shows").then(function(r) { shows=r; localStorage.setItem("shows", JSON.stringify(shows)); localStorage.setItem("lastshowupdate", new Date());}, errhandle);
    } else {
        shows=JSON.parse(localStorage.getItem("shows"));
    }


    var menu=[];

    function domenu() {
        if (!$('#drinks').length) return;
        var d=$('#drinks').empty();
        var u=$('<ul />', {"class": "list-unstyled list-group"});
        d.append(u);
        var s=0;
        $.each(menu, function(section, rows) {
            if (section=='Food') {
                u=$('<ul />', {"class": "list-unstyled list-group"});
                d.append('<h2 id="food" class="bg-primary">Food</h2>');
                d.append(u);
                return true;
            }
            u.append($('<li />', {"class": "list-group-item-heading bg-primary", "text": section, "id": 'm'+s}));
            s++;
            $.each(rows, function(i, item) {
                var l='<li class="list-group-item"><strong>'+item[2]+'</strong>';
                if (item[3]) l += '<br /><em>'+item[3]+'</em>';
                l += '<span class="badge">'+item[5]+'</span></li>';
                u.append(l);
            });
            //d.append('<div id="m'+i+'"><h2>'+section+'</h2><ul class="list-group')
        });
    }

    if (localStorage.getItem('lastmenuupdate')) {
        s=new Date(localStorage.getItem('lastmenuupdate'));
    }
    if (!localStorage.getItem('menu')||s.getTime()<(now.getTime()-3600*24*7)) {
        api("menu").then(function(d) {
            menu=d;
            localStorage.setItem('menu', JSON.stringify(d));
            localStorage.setItem('lastmenuupdate', new Date());
            domenu();
        }, errhandle);
    } else {
        menu=JSON.parse(localStorage.getItem('menu'));
        domenu();
    }

    var currentshow=0;

    $(document).on('show', '#showing', function() {
        onlyonepage(this);
        if (shows) {
            currentshow = 0;
            $('#shows').empty();
            $.each(shows, function(i,v) {
                var d, tp= null;
                d=$('<div />', {"class": "col-xs-12 clearfix", "id": "show"+i});
                h2=($('<h2 />', {text: v.show_name})).appendTo(d);
                d.append($('<img />', {'class': 'pull-right', src: 'https://alexanderbar.co.za/glasstopimages/showimage/185/'+v.showimages[0].showimage_uid+'_'+v.showimages[0].file.substr(0,v.showimages[0].file.length-4)+'.png', alt: v.caption}));
                d.append('<em>'+v.who+' | '+v.genre+' | '+v.duration+'</em>');
                $.each([])
                if (v.warning) d.append('<br /><span class="text-danger">'+v.warning+'</span>');
                d.append('<div>'+v.description+'</div>');
                if (v.moreinfo) {
                    $('<a />', {'data-toggle': 'collapse', 'data-target': '#more'+v.show_uid, 'text': 'Read More'}).appendTo(d);
                    d.append($('<p />', {'id': 'more'+v.show_uid, 'class': 'collapse'}).html(v.moreinfo));
                    d.append('<br />');
                }
                var bb=$('<div />', {"class":"clearfix"}).appendTo(d);
                $.each(v.performances, function(i,p) {
                    var ticketprice;
                    var seating;
                    //convoluted data structure: we just take last seating and ticketprice record
                    $.each(p.seatings, function(i,s) {
                        $.each(s.ticketprices, function(i, tp) {
                            ticketprice=tp;
                        });
                        seating=s;
                    });
                    
                    if (ticketprice.ticketsleft>0) {
                        var b=$('<button />', {"type": "button", "class": "btn btn-lg booknow col-xs-12 col-md-4 col-lg-3", "data-toggle": "modal", "data-target": "#booknowmodal"}).appendTo(bb);
                        if (ticketprice.ticketsleft<=20) {
                            b.addClass('btn-warning');
                            b.text(sprintf('Hurry! Only %d ticket%s left for\n%s', ticketprice.ticketsleft, ticketprice.ticketsleft==1?'':'s', p.nicedate));
                        } else {
                            b.addClass('btn-primary');
                            b.text(sprintf('Book for %s', p.nicedate));
                        }
                        b.data('show', v);
                        b.data('ticketprice', ticketprice);
                        b.data('performance', p);
                        b.data('seating', seating);
                    } else {
                        bb.append($('<button />', {"class": "btn-danger btn-lg col-xs-12 col-md-4 col-lg-3", "type": "button", "disabled": true, "text": "Sorry, Sold Out" }));
                    }
                });
                d.append($('<hr />', {"class": "clearfix"}));
                d.appendTo('#shows');
            });
        }
    });

    $(document).on('click', '.booknow', function() {
        var show=$(this).data('show');
        var ticketprice=$(this).data('ticketprice');
        var seating=$(this).data('seating');
        var performance=$(this).data('performance');
        var m=$('#booknowmodal');
        m.data('show', show);
        m.data('ticketprice', ticketprice);
        m.data('seating', seating);
        var b=m.find('.modal-body');
        b.empty();
        b = $('<form />', {"class":"form-horizontal", "role":"form"}).appendTo(b);
        m.find('.modal-title small').text(show.show_name + ': '+performance.nicedate);
        var fg1=$('<div />', {"class": "form-group"}).appendTo(b);
        fg1.append('<label>How many tickets? </label>');
        fg1.append($('<input />', {"class": "form-control required", "type": "number", "name": "qty", "min": 1, "max": ticketprice.ticketsleft}));
        var fg2=$('<div />', {"class": "form-group"}).appendTo(b);
        fg2.append('<label>Pay now or later?</label>');
        fg2.append('<div class="btn-group" data-toggle="buttons"><label class="btn btn-primary active" for="now">Now<input class="required" id="now" name="noworlater" type="radio" value="now" checked/></label><label class="btn btn-primary" for="later">Later<input class="required" id="later" name="noworlater" type="radio" value="later" /></label></div>');
        var fg3=$('<div />', {"class": "form-group"}).appendTo(b);
        fg3.append('<label>Total Due</label>');
        fg3.append($('<input />', {"class": "form-control", "id": "total", readonly:true}));
        b.append('<p><strong>Your credit card details are transmitted over a secure SSL connection. We accept VISA and Mastercard credit cards.</strong></p>');
        var fg4=$('<div />', {"class": "form-group"}).appendTo(b);
        //Card ending in? Or use new credit card
        var cards = JSON.parse(localStorage.getItem('cards')||'[]');
        var fg5=$('<div />', {"class": "btn-group", "data-toggle":"buttons", "style": "margin-bottom: 1em"}).appendTo(b);
        var cs;
        if (cards) {
            $.each(cards, function(i, card) {

                fg5.append('<label class="btn btn-primary'+(i==0?' active': '')+'"><input value="'+i+'" name="card" type="radio" '+(i==0?' checked':'')+'/>Use card ending in '+card.cardnumber.substr(card.cardnumber.length-4)+'</label><button class="btn btn-primary deletecard" value="'+i+'"><i class="glyphicon glyphicon-trash"></i></button><br />');
            });
        }
        fg5.append('<label class="btn btn-primary'+(cards.length?'':' active')+'"><input value="new" name="card" type="radio" '+(cards.length?'':' checked')+' />Pay with this Credit Card:</label>');


        var nc=$('<div />').appendTo(b);
        
        var fg6=$('<div />', {"class": "form-group"}).appendTo(nc);
        fg6.append('<label>Card Number</label>');
        fg6.append('<input type="number" class="form-control required" type="text" size="16" maxlength="16" minlength="16" name="cardnumber" />');
        var fg7=$('<div />', {"class": "form-group"}).appendTo(nc);
        fg7.append('<label>Expiry Month</label>');
        fg7.append('<select class="form-control required" name="expirymonth"><option value=""></option><option value="1">Jan</option><option value="2">Feb</option> <option value="3">Mar</option> <option value="4">Apr</option> <option value="5">May</option> <option value="6">Jun</option> <option value="7">Jul</option> <option value="8">Aug</option> <option value="9">Sep</option> <option value="10">Oct</option> <option value="11">Nov</option> <option value="12">Dec</option></select>');
        var fg8=$('<div />', {"class":"form-group"}).appendTo(nc);
        fg8.append('<label>Expiry Year</label>')
        fg8.append('<div class="input-group"><div class="input-group-addon">20</div><input name="expiryyear" type="number" class="form-control required" minlength="2" maxlength="2" pattern="1[0-9]" min="14" max="99" /></div>');
        var fg9=$('<div />', {"class": "form-group"}).appendTo(nc);
        fg9.append('<label>CCV (3 numbers on back of card)</label>');
        fg9.append('<input minlength="3" maxlength="3" type="number" class="form-control required" name="ccv" />');

        $('[name="noworlater"]').change(function() {
            if ($(this).val()=="later") {
                fg5.hide();
                nc.hide();
            } else {
                fg5.show();
                $('[name="card"]:checked').trigger('change');
            }
        });
        $('[name="card"]').on('change', function() {
            if ($(this).val()=='new') nc.show(); else {
                nc.hide();
            }
        });
        $(':radio[name="card"]:checked').trigger('change');
        $('button.deletecard').on('click', function() {
            var i=$(this).val();
            var card = cards[i];
            var t=$(this);
            if (confirm('Are you sure you want to delete card ending in '+card.cardnumber.substr(card.cardnumber.length-4)+'?')) {
                delete cards[i];
                cards = $.map(cards, function(e) { return e; });
                localStorage.setItem('cards', JSON.stringify(cards));
                t.prev().remove();
                t.remove();
            }
        });

        var last=$('<div />', {"class": "text-center"}).appendTo(b);


        var bookbtn=$('<button />', {"id": "bookit", "class": "btn btn-lg btn-success", "type": "submit", "text": "BOOK IT!", "data-loading-text": "Please wait..."}).appendTo(last);


        b.validate({errorClass: "text-danger", rules: {cardnumber: {luhnCheck: true}}, submitHandler:function(form,evt) {
            bookbtn.button('loading');
            evt.preventDefault();
            var vals = b.serializeObject();
            var card, d;
            if (vals.cardnumber) {
                card={cardnumber: vals.cardnumber, expirymonth: vals.expirymonth, expiryyear: vals.expiryyear, ccv: vals.ccv};
                cards.push(card);
                localStorage.setItem('cards', JSON.stringify(cards));
            } else if (vals.card||vals.card=="0") {
                card = cards[Number(vals.card)];
            } else {
                card=false;
            }
            //customer_code, performance_uid, ticketprice_uid, seatingplan_uid, qty, cardnumber, expirymonth, expiryyear, ccv):
            if (card) {
                d={qty: vals.qty, performance_uid: performance.performance_uid, ticketprice_uid:ticketprice.ticketprice_uid, seating_uid: seating.seating_uid, cardnumber: card.cardnumber, expirymonth: card.expirymonth, expiryyear: "20"+card.expiryyear, ccv: card.ccv}
            } else {
                d={qty: vals.qty, performance_uid: performance.performance_uid, ticketprice_uid:ticketprice.ticketprice_uid, seating_uid: seating.seating_uid}
            }
            apipost("bookshow", d).then(function(a) {
                if (a[0]) {
                    m.modal('hide');
                        if (a[1][0] && a[1][0].toLowerCase()=="approved") {
                            alert("Thanks. Your tickets are booked and paid for. You should receive an email confirmation shortly.");
                        } else {
                            alert("Thanks. Your tickets have been reserved but not yet paid for. You should receive an email confirmation shortly.");
                        }
                } else {
                    alert('Sorry but there was a problem ('+a[1][0]+') - please check details and try again.');
                }
            }, errhandle);

        }});
    });

    $(document).on('change', ':input[name="qty"], :input[name="noworlater"]', function() {
        var vals=$('#booknowmodal form').serializeObject();
        var m=$('#booknowmodal');
        var ticketprice=m.data('ticketprice');
        var total=Number(vals.qty) * Number((vals.noworlater=="later") ? ticketprice.price: ticketprice.lowprice);
        $('#total').val(sprintf('R%.0f', total));
    });

    $('#telegramform').validate({errorClass: "text-danger", submitHandler: function(evt,form) {
        var vals=$('#telegramform').serializeObject();
        apipost("telegram", {"to":vals.to,"text":vals.message}).then(function() {
            $('#telegramform')[0].reset();
            $('#telegrammodal').modal('hide');
            alert("Telegram sent");
        });
    }});

    Hammer(document.getElementById('menu1')).on('swipeleft swiperight', function(evt) {
        console.log(evt.type);
        var m=location.hash.split('m');
        if (Number(m[1]>=0)) {
            if (evt.type=='swipeleft') {
                location.href='#m'+(Number(m[1])+1);
            } else {
                location.href='#m'+(Number(m[1])-1);
            }
        }
    });

    $('#florinreg').click(function() {
        window.open('https://alexanderbar.co.za/florin/', '_system');
    });
    $('#resendpass').click(function() {
        var code=$('#customer_code').val();
        if (code.length<5) {
            code = prompt('Please enter your Florin number or cellphone number:');
        }
        apipost("resetpassword", {customer_code:code}).then(function() {
            alert('Please check your SMS messages');
        }, errhandle);
    });


    $(window).on('hashchange', function(evt) {
        var w=$(location.hash);
        if ($(w).length==1 && w.hasClass('page')) {
            onlyonepage(w);
            w.trigger('show');
        }
    });

    function main(){
      if (!customertoken) {
        $('#loginpage').trigger('show');
        location.href='#loginpage';
      } else {
        location.href='#persian';
       }
      $(window).trigger('hashchange');
    }
    main();

    $('#exit').on('click', function() {
        app.exitApp();       
    });
});