// ==UserScript==
// @name         Derpibooru downloader plugin
// @namespace    derpibooru.org
// @version      0.2
// @updateURL    https://github.com/Rain0Ash/Derpi-Downloader-Plugin/raw/master/DerpiDownloaderPlugin.user.js
// @downloadURL  https://github.com/Rain0Ash/Derpi-Downloader-Plugin/raw/master/DerpiDownloaderPlugin.user.js
// @description  None
// @author       Rain0Ash
// @match        https://derpibooru.org/*
// @match        https://furbooru.org/*
// @require      https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js#sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11.3.0/dist/sweetalert2.all.min.js#sha256-nk6ExuG7ckFYKC1p3efjdB14TU+pnGwTra1Fnm6FvZ0=
// @resource     sweetalert2css https://cdn.jsdelivr.net/npm/sweetalert2@11.3.0/dist/sweetalert2.min.css#sha256-nFFDxS+xhna4bwS24M3iV8ADBz/vfg1vdrL8o7dSliQ=
// @resource     sweetalert2dark https://cdn.jsdelivr.net/npm/@sweetalert2/theme-dark@5.0.8/dark.min.css#sha256-cdXZTh05rkMjO71L2RPaa5OHSDXKAxKvuBAmCOGMHNQ=
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_xmlhttpRequest
// @connect      localhost
// ==/UserScript==


(function () {
    'use strict';

    try {
        // noinspection JSUnresolvedFunction
        GM_addStyle(GM_getResourceText("sweetalert2css"));
        // noinspection JSUnresolvedFunction
        GM_addStyle(GM_getResourceText("sweetalert2dark"));
    } catch (e) {

    }

    const debug = true;
    const httpsstatus = true;
    const question_limit_for_artist = 30;
    const question_limit_for_editor = 5;
    const question_limit_for_oc = 5;

    function PopupCenter(url, title, w, h) {
        const dualScreenLeft = window?.screenLeft ?? window.screenX;
        const dualScreenTop = window?.screenTop ?? window.screenY;

        const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
        const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

        const systemZoom = width / window.screen.availWidth;
        const left = (width - w) / 2 / systemZoom + dualScreenLeft
        const top = (height - h) / 2 / systemZoom + dualScreenTop
        return window.open(url, title, `scrollbars=yes,width=${w / systemZoom}, height=${h / systemZoom}, top=${top}, left=${left}`)
    }

    function Send(data, https) {
        if (https === undefined) {
            https = httpsstatus;
        }

        try {
            if (debug) {
                console.log(`Request data: ${data}. Https status: ${https}`);
            }

            const site = "localhost"
            const port = 18432;
            const address = `${site}:${port}`;

            const uri = `${https || https === null ? "https" : "http"}://${address}/${window.location.hostname}`;

            try {
                const post = JSON.stringify({download: data});
                let successful = undefined;

                GM_xmlhttpRequest({
                    method: 'POST',
                    timeout: 1000,
                    url: uri,
                    data: post,
                    headers: {
                        "Content-Type": "application/json"
                    },
                    onload: function (event) {
                        if (debug) {
                            console.log(`Server return: ${event.responseText}`);
                        }

                        successful = true;
                        return successful;
                    },
                    ontimeout: function (event) {
                        if (debug) {
                            console.log(`Timeout of https: ${https}`);
                        }

                        if (https === null) {
                            return Send(data, false);
                        }

                        Swal.fire({
                            title: `<font size="3px">Server connection timeout for <br><font size="3px" color="orange">${data}</font> request.</font>`,
                            confirmButtonText: 'Confirm'
                        });

                        successful = false;
                        return successful;
                    }
                });

                return successful !== undefined ? successful : true;
            }
            catch (e){
                /*const get = encodeURI(`${uri}?download=${btoa(data)}`);
                const handle = PopupCenter(get, "_blank", 300, 300);*/
                return false;
            }
        } catch (e) {
            alert(e);
            return false;
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
                                title: `<font size="3px">Do you want to download <font size="4px" color="#7cfc00">${count}</font> images of <br><font size="3px" color="orange">${tagname}</font> ?</font>`,
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
                "border-radius": "5px",
            });

            download_node.on("click", () => {
                download_node.css("background-color", "#CC5");
                const result = Send(`id:${id}`);
                if (!result){
                    download_node.css("background-color", "#C55");
                    return;
                }

                download_node.css("background-color", "#5C5");
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
            });

            download_node.on("click", () => {
                download_node.css("background-color", "#CC5");
                const result = Send(`id:${id}`);
                if (!result){
                    download_node.css("background-color", "#C55");
                    return;
                }

                download_node.css("background-color", "#5C5");
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
