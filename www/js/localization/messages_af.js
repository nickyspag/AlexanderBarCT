/*
 * Translated default messages for the jQuery validation plugin.
 * Locale: Afrikaans
 */
(function ($) {
	$.extend($.validator.messages, {
		required: "Hierdie inligting word vereis.",
		remote: "Stel hierdie veld.",
		email: "Voer asseblief 'n geldige e-posadres.",
		url: "Voer'n geldige URL.",
		date: "Voer asseblief 'n geldige datum.",
		dateISO: "Voer asseblief 'n geldige datum (ISO).",
		number: "Voer asseblief 'n geldige waarde nie.",
		digits: "Voer asseblief net syfers.",
		creditcard: "Voer asseblief 'n geldige kredietkaart nommer.",
		equalTo: "Asseblief dieselfde waarde weer.",
		maxlength: $.validator.format("Asseblief nie meer as {0} karakters."),
		minlength: $.validator.format("Asseblief nie min as {0} karakters."),
		rangelength: $.validator.format("Voer asseblief 'n waarde tussen {0} en {1} karakters lank."),
		range: $.validator.format("Voer asseblief 'n waarde tussen {0} en {1}"),
		max: $.validator.format("Voer asseblief 'n waarde van minder as of gelyk aan {0}."),
		min: $.validator.format(" Voer asseblief 'n waarde groter as of gelyk aan {0}.")
	});
}(jQuery));