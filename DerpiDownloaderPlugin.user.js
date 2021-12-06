// ==UserScript==
// @name         Derpibooru downloader plugin
// @namespace    derpibooru.org
// @version      0.1
// @description  None
// @author       Rain0Ash
// @match        https://derpibooru.org/*
// @match        https://furbooru.org/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11.3.0/dist/sweetalert2.all.min.js
// @resource     sweetalert2css https://cdn.jsdelivr.net/npm/sweetalert2@11.3.0/dist/sweetalert2.min.css
// @resource     sweetalert2dark https://cdn.jsdelivr.net/npm/@sweetalert2/theme-dark@5.0.8/dark.min.css
// @grant        GM_addStyle
// @grant        GM_getResourceText
// ==/UserScript==


(function () {
    'use strict';

    try {
        // noinspection JSUnresolvedFunction
        GM_addStyle(GM_getResourceText("sweetalert2css"));
        GM_addStyle(GM_getResourceText("sweetalert2dark"));
    } catch (e) {

    }

    const debug = true;
    const question_limit_for_artist = 30;
    const question_limit_for_editor = 5;
    const question_limit_for_oc = 5;

    function Send(data) {
        try {
            if (debug) {
                console.log(data);
            }

            const site = "localhost"
            const port = 18432;
            const address = `${site}:${port}`;

            const handle = window.open(encodeURI(`https://${address}/${window.location.hostname}/download/${btoa(data)}`));
        } catch (e) {
            alert(e);
        }
    }

    function AddSearchDownloadButton() {
        const search = $(".header__search").first();
        const first_search = search.children().first();
        const download_node = $("<button class=\"header__search__button\" type=\"button\" title=\"Download\"><i class=\"fa fa-download\"></i></button>");
        download_node.on("click", () => Send($("#q").val()));
        download_node.insertAfter(first_search);
    }

    function AddArtistTagDownloadButton() {
        const tags = $("span.tag.dropdown");

        for (let tag of tags) {
            tag = $(tag);
            const tagname = tag.attr("data-tag-name");

            if (!tagname || !tagname.startsWith("artist:") && !tagname.startsWith("editor:") && !tagname.startsWith("oc:")) {
                continue;
            }

            const download_node = $("<button class=\"tag dropdown\" type=\"button\" title=\"Download\"><i class=\"fa fa-download\"></i></button>");
            download_node.attr("data-tag-category", tag.attr("data-tag-category"));
            download_node.on("click", () => {
                try {
                    const count = Number(tag.children().last("span.tag__count").text());

                    if ((tagname.startsWith("artist:") && count > question_limit_for_artist) ||
                        (tagname.startsWith("editor:") && count > question_limit_for_editor) ||
                        (tagname.startsWith("oc:") && count > question_limit_for_oc)) {

                        try {
                            Swal.fire({
                                title: `<font size="3px"> You want to download <font size="4px" color="#7cfc00">${count}</font> images of <br><font size="3px" color="orange">${tagname}</font> ?</font>`,
                                showDenyButton: true,
                                confirmButtonText: 'Download',
                                denyButtonText: `Cancel`,
                            }).then((result) => {
                                if (result.isConfirmed) {
                                    Send(tagname);
                                }
                            })
                        } catch (e) {
                            if (confirm(`You want to download ${count} images of ${tagname}. Confirm?`)) {
                                Send(tagname);
                                return;
                            }
                        }

                        return;
                    }
                } catch (e) {
                    alert(e);
                }

                Send(tagname);
            });

            download_node.insertBefore(tag.children().last());
        }
    }

    function AddImageContainerDownloadButton() {
        const images = $(".image-container");

        for (let image of images) {
            image = $(image);

            const id = image.attr("data-image-id");
            const download_node = $("<button class=\"tag dropdown\" type=\"button\" title=\"Download\"><i class=\"fa fa-download\"></i></button>");
            download_node.css({
                "position": "absolute",
                "opacity": "0.60",
                "top": "100%",
                "left": "50%",
                "transform": "translate(-50%, -100%)",
                "-ms-transform": "translate(-50%, -100%)",
                "background-color": "#555",
                "color": "white",
                "font-size": "12px",
                "padding": "4px 24px",
                "border": "none",
                "cursor": "pointer",
                "border-radius": "5px"
            })

            download_node.on("click", () => {
                Send(`id:${id}`)
            });

            download_node.insertAfter(image.children().last());
        }
    }

    function AddImageShowContainerDownloadButton() {
        const images = $(".image-show-container");

        for (let image of images) {
            image = $(image);

            const id = image.attr("data-image-id");
            const download_node = $("<button class=\"tag dropdown\" type=\"button\" title=\"Download\"><i class=\"fa fa-download\"></i></button>");
            download_node.css({
                "position": "relative",
                "opacity": "0.60",
                "top": "100%",
                "left": "50%",
                "transform": "translate(-50%, -100%)",
                "-ms-transform": "translate(-50%, -100%)",
                "background-color": "#555",
                "color": "white",
                "font-size": "24px",
                "padding": "4px 100px",
                "border": "none",
                "cursor": "pointer",
                "border-radius": "5px"
            })

            download_node.on("click", () => {
                Send(`id:${id}`)
            });

            download_node.insertAfter(image.children().last());
        }
    }

    function Main() {
        AddSearchDownloadButton();
        AddArtistTagDownloadButton();
        AddImageContainerDownloadButton();
        AddImageShowContainerDownloadButton();
    }

    $("document").ready(Main);
})();