class Util {

    DOM_ANALYSIS_COMMON_OPTIONS() {
        return ['font', 'border', 'background'];
    }

    DOM_ANALYSIS_EXCLUDED_TAGNAME() {
        return ['TITLE', 'STYLE', 'META', 'LINK', 'SCRIPT', 'BASE', 'AUDIO', 'VIDEO', 'HEAD'];
    }

    DOM_ANALYSIS_RGBA_FORCED_PROPERTIES() {
        return ['background-color', 'border-left-color', 'border-right-color', 'border-top-color', 'border-bottom-color', 'color'];
    }

    DOM_ANALYSIS_OPTION_PROPERTIES() {
        return {
            font: ['font-family', 'font-size', 'font-weight', 'color'],
            border: ['border-bottom-color', 'border-bottom-left-radius', 'border-bottom-right-radius', 'border-bottom-style', 'border-bottom-width', 'border-left-color', 'border-left-style', 'border-left-width', 'border-right-color', 'border-right-style', 'border-right-width', 'border-top-color', 'border-top-left-radius', 'border-top-right-radius', 'border-top-style', 'border-top-width'],
            background: ['background-color']
        };
    }

    REGEX_HEX_FORMAT() {
        return /^#(?:[A-Fa-f0-9]{3}){1,2}$/;
    }

    REGEX_RGB_FORMAT() {
        return /^rgb[(](?:\s*0*(?:\d\d?(?:\.\d+)?(?:\s*%)?|\.\d+\s*%|100(?:\.0*)?\s*%|(?:1\d\d|2[0-4]\d|25[0-5])(?:\.\d+)?)\s*(?:,(?![)])|(?=[)]))){3}[)]$/;
    }

}


class Lfp {

    static util = new Util()

    static analyseEligibleElements(optionsName) {
        let resultTemplate = [];
        let elements = document.querySelectorAll('*');
        Lfp.createResultsFromOptions(resultTemplate, optionsName);
        let length = elements.length;
        for (let i = 0; i < length; i++) {
            if (Lfp.includes(Lfp.util.DOM_ANALYSIS_EXCLUDED_TAGNAME(), elements[i].tagName)) {
                continue
            }
            Lfp.analyseElementFromPseudos(resultTemplate, optionsName, elements[i])
        }
        return this.sortResultTemplate(resultTemplate)
    }

    static analyseElementFromPseudos(resultTemplate, optionsName, element) {
        Lfp.hasMulptipleCssProperty(resultTemplate, optionsName, element);
        let pseudoElement = [':before', ':after'];
        let length = pseudoElement.length;
        for (let i = 0; i < length; i++) {
            let content = window.getComputedStyle(element, pseudoElement[i]).content;
            if (content === 'none') {
                return
            }
            Lfp.hasMulptipleCssProperty(resultTemplate, optionsName, element, pseudoElement[i])
        }
    }

    static addElementCssPropertiesValue(option, element, pseudo, optionAndResultsObject) {
        let resultTemp = {
            score: 0,
            strValue: '',
            properties: []
        };
        let length = option.length;
        for (let i = 0; i < length; i++) {
            let elementCssPropValue = Lfp.setElementCsspropertyValueAndConvertToRGBAIfColor(element, pseudo, option[i]);
            if (Lfp.includes(Lfp.util.DOM_ANALYSIS_RGBA_FORCED_PROPERTIES(), option[i])) {
                elementCssPropValue = Lfp.convertColorToRgba(elementCssPropValue)
            }
            resultTemp.properties.push({property: [option[i]], value: elementCssPropValue});
            resultTemp.strValue += elementCssPropValue
        }
        if (optionAndResultsObject.results.length === 0) {
            optionAndResultsObject.results.push(resultTemp);
        } else {
            Lfp.addPropertyValueInPropertiesOrUpdateScore(optionAndResultsObject, resultTemp)
        }
    }

    static setElementCsspropertyValueAndConvertToRGBAIfColor(element, pseudo, option) {
        let elementCssPropValue = window.getComputedStyle(element, pseudo)[option];
        if (Lfp.includes(Lfp.util.DOM_ANALYSIS_RGBA_FORCED_PROPERTIES(), option)) {
            elementCssPropValue = Lfp.convertColorToRgba(elementCssPropValue)
        }
        return elementCssPropValue
    }

    static addElementCssPropertyValue(option, element, pseudo, optionAndResultsObject) {
        let elementCssPropValue = Lfp.setElementCsspropertyValueAndConvertToRGBAIfColor(element, pseudo, option);
        let resultTemp = {
            score: 0,
            strValue: elementCssPropValue,
            properties: [{property: option, value: elementCssPropValue}]
        };
        if (optionAndResultsObject.results.length === 0) {
            optionAndResultsObject.results.push(resultTemp)
        } else {
            Lfp.addPropertyValueInPropertiesOrUpdateScore(optionAndResultsObject, resultTemp)
        }
    }

    static addPropertyValueInPropertiesOrUpdateScore(optionAndResultsObject, resultTemp) {
        let length = optionAndResultsObject.results.length;
        for (let i = 0; i < length; i++) {
            if (optionAndResultsObject.results[i].strValue === resultTemp.strValue) {
                optionAndResultsObject.results[i].score++;
                break
            } else if (i === optionAndResultsObject.results.length - 1) {
                optionAndResultsObject.results.push(resultTemp)
            }
        }
    }

    static createResultsFromOptions(resultTemplate, optionsName) {
        optionsName.forEach(function (option) {
            let optionAndResultsObject = {
                option: option,
                results: []
            };
            resultTemplate.push(optionAndResultsObject)
        })
    }

    static hasMulptipleCssProperty(resultTemplate, optionsName, element, pseudo) {
        optionsName.forEach(function (option, i) {
            if (Array.isArray(Lfp.util.DOM_ANALYSIS_OPTION_PROPERTIES()[option])) {
                option = Lfp.util.DOM_ANALYSIS_OPTION_PROPERTIES()[option];
                Lfp.addElementCssPropertiesValue(option, element, pseudo, resultTemplate[i])
            } else {
                Lfp.addElementCssPropertyValue(option, element, pseudo, resultTemplate[i])
            }
        })
    }

    static includes(container, value) { 
        return container.indexOf(value) >= 0;
    }

    static convertColorToRgba(colorProp) {
        if (Lfp.util.REGEX_HEX_FORMAT().test(colorProp)) {
            colorProp = Lfp.hexToRgba(colorProp)
        } else if (Lfp.util.REGEX_RGB_FORMAT().test(colorProp)) {
            colorProp = Lfp.rgbToRgba(colorProp)
        }
        return colorProp
    }

    static rgbToRgba(rgb) {
        function insert(string, index, stringToInsert) {
            if (index > 0) {
                return string.substring(0, index) + stringToInsert + string.substring(index, string.length)
            }
            return stringToInsert + string
        }

        rgb = insert(rgb, 3, 'a');
        rgb = insert(rgb, rgb.length - 1, ',1');
        return (rgb);
    }

    static hexToRgba(hex) {
        let r = 0;
        let g = 0;
        let b = 0;
        if (hex.length === 4) {
            r = '0x$' + hex[1] + hex[1];
            g = '0x$' + hex[2] + hex[2];
            b = '0x$' + hex[3] + hex[3];
        } else if (hex.length === 7) {
            r = '0x$' + hex[1] + hex[2];
            g = '0x$' + hex[3] + hex[4];
            b = '0x$' + hex[5] + hex[6];
        }
        return ('rgba(' + parseInt(r) + ',' + parseInt(g) + ',' + parseInt(b) + ',1)')
    }

    static sortByScore(a, b) {
        if (a.score > b.score) {
            return -1
        }
        if (a.score < b.score) {
            return 1
        }
        return 0
    }

    static sortResultTemplate(resultTemplate) {
        for (let i = 0; i < resultTemplate.length; i++) {
            resultTemplate[i].results.sort(this._sortByScore);
        }
        return resultTemplate
    }

    constructor() {
        this.commonStyleAnalysis = function() {
            return Lfp.analyseEligibleElements(Lfp.util.DOM_ANALYSIS_COMMON_OPTIONS());
        }
        this.customStyleAnalysis = function(optionsName) {
            return Lfp.analyseEligibleElements(optionsName);
        }
    }
};


var lfp = new Lfp()
