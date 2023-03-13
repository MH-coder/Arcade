$.ajaxPrefilter(function (options, originalOptions, jqXHR) {
  var csrf_token = $('meta[name="csrf-token"]').attr("content");
  if (
    options.type.toLowerCase() !== "get" &&
    !options.url.startsWith("/account/portfolio") &&
    !options.url.startsWith("/publish/portfolio/thumbnail") &&
    !options.url.startsWith("/admin/sample/thumbnail")
  ) {
    // initialize `data` to empty string if it does not exist
    options.data = options.data || "";

    // add leading ampersand if `data` is non-empty
    options.data += options.data ? "&" : "";

    // add _token entry
    options.data += "_csrf=" + encodeURIComponent(csrf_token);
  }
});
