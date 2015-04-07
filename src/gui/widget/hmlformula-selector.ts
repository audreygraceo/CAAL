/// <reference path="../../../lib/jquery.d.ts" />
/// <reference path="../../../lib/ccs.d.ts" />

module GUI.Widget {
    export type HMLSelectListener = (formula : HML.Formula) => void;

    export class FormulaSelector {
        private root = document.createElement("div");
        private paragraph = document.createElement("p");
        private currentHml : HML.Formula;
        private currentHmlSet : HML.FormulaSet;

        public onSelectListener : HMLSelectListener = null;

        constructor() {        
            var $root = $(this.root);
            var $paragraph = $(this.paragraph);
            
            $paragraph.attr("id", "hml-selector-paragraph");

            $root.attr("id", "hml-selector-body");
            $root.addClass("no-highlight");

            $root.append(this.paragraph);

            /*Click listeners on each subformula*/
            $root.on("click", "span.hml-subformula", this.onSubformulaClick.bind(this));
        }

        setFormulaSet(hmlFormulaSet : HML.FormulaSet) {
            this.currentHmlSet = hmlFormulaSet;
        }

        setFormula(hmlFormula : HML.Formula){
            var $paragraph = $(this.paragraph);
            $paragraph.empty(); // clear the previous HML formula
            
            if(hmlFormula){
                this.currentHml = hmlFormula

                var HMLVisitor = new HMLSubFormulaHTMLVisitor(this.currentHmlSet);
                var hmlFormulaStr = HMLVisitor.visit(hmlFormula); // convert the formula to a string
                $paragraph.append(hmlFormulaStr);
            } else {
                $paragraph.append("No more moves");
            }
        }

        public getRootElement() : HTMLElement {
            return this.root;
        }

        private subformulaFromDelegateEvent(event) : HML.Formula {
            var id = parseInt($(event.currentTarget).attr("data-subformula-id"));
            var hmlExtractor = new HMLSubFormulaExtractor(this.currentHmlSet);
            var subFormula : HML.Formula = hmlExtractor.getSubFormulaWithId(this.currentHml, id);
            return subFormula;
        }

        private onSubformulaClick(event) {
            if(this.onSelectListener) {
                this.onSelectListener(this.subformulaFromDelegateEvent(event));
            }
        }
    }

    class HMLSubFormulaHTMLVisitor implements HML.FormulaVisitor<string>, HML.FormulaDispatchHandler<string> { 
        private isFirst = true;

        constructor(private hmlFormulaSet : HML.FormulaSet) {
        }

        visit(formula : HML.Formula) {
            return formula.dispatchOn(this);
        }

        private isFirstFormula() : boolean {
            if(this.isFirst){
                this.isFirst = !this.isFirst;
                return true;
            }

            return false;
        }

        dispatchDisjFormula(formula : HML.DisjFormula) {
            var result;
            var isfirst = this.isFirstFormula();

            var subStrs = formula.subFormulas.map((subF) => {
                if(isfirst) {
                    var $span = $('<span></span>').addClass('hml-subformula').attr('data-subformula-id', subF.id);
                    $span.append(subF.dispatchOn(this));
                    return $span[0].outerHTML;                    
                } else {
                    return subF.dispatchOn(this);
                }
            });
            result = subStrs.join(" or ");

            return result;
        }

        dispatchConjFormula(formula : HML.ConjFormula) {
            var result;
            var isfirst = this.isFirstFormula();

            var subStrs = formula.subFormulas.map(subF => {
                var unwrapped = subF.dispatchOn(this);
                var wrapped = Traverse.wrapIfInstanceOf(unwrapped, subF, [HML.DisjFormula]);
                if(isfirst) {
                    var $span = $('<span></span>').addClass('hml-subformula').attr('data-subformula-id', subF.id);
                    $span.append(wrapped);     
                    return $span[0].outerHTML;
                } else {
                    return wrapped;
                }
            });

            return result = subStrs.join(" and ");;
        }

        dispatchTrueFormula(formula : HML.TrueFormula) {
            var result;
            var isfirst = this.isFirstFormula();

            if(isfirst) {
                var $span = $('<span></span>').addClass('hml-subformula').attr('data-subformula-id', '-1');
                $span.append('T');
                result = $span[0].outerHTML;
            } else {
                result = "T";
            }

            return result;
        }

        dispatchFalseFormula(formula : HML.FalseFormula) {
            var result;
            var isfirst = this.isFirstFormula();

            if(isfirst) {
                var $span = $('<span></span>').addClass('hml-subformula').attr('data-subformula-id', '-1');
                $span.append('F');
                result = $span[0].outerHTML;
            } else {
                result = "F";
            }

            return result;
        }

        dispatchStrongExistsFormula(formula : HML.StrongExistsFormula) {
            var result
            var isfirst = this.isFirstFormula();
            var subStr = formula.subFormula.dispatchOn(this);
            var formulaAction = "<" + formula.actionMatcher.actionMatchingString() + ">";
            var formulaStr = Traverse.safeHtml(formulaAction) +
                Traverse.wrapIfInstanceOf(subStr, formula.subFormula, [HML.DisjFormula, HML.ConjFormula]);
            
            if (isfirst) {
                var $span = $('<span></span>').addClass('hml-subformula').attr('data-subformula-id', formula.subFormula.id);
                $span.append(formulaStr)
                result = $span[0].outerHTML;
            } else {
                result = formulaStr;
            }

            return result;
        }

        dispatchStrongForAllFormula(formula : HML.StrongForAllFormula) {
            var result;
            var isfirst = this.isFirstFormula();
            var subStr = formula.subFormula.dispatchOn(this);
            var formulaAction = "[" + formula.actionMatcher.actionMatchingString() + "]";
            var formulaStr = Traverse.safeHtml(formulaAction) +
                Traverse.wrapIfInstanceOf(subStr, formula.subFormula, [HML.DisjFormula, HML.ConjFormula]);

            if (isfirst) {
                var $span = $('<span></span>').addClass('hml-subformula').attr('data-subformula-id', formula.subFormula.id);
                $span.append(formulaStr)
                result = $span[0].outerHTML;
            } else {
                result = formulaStr;
            }

            return result;
        }

        dispatchWeakExistsFormula(formula : HML.WeakExistsFormula) {
            var result
            var isfirst = this.isFirstFormula();
            var subStr = formula.subFormula.dispatchOn(this);
            var formulaAction = "<<" + formula.actionMatcher.actionMatchingString() + ">>";
            var formulaStr = Traverse.safeHtml(formulaAction) +
                Traverse.wrapIfInstanceOf(subStr, formula.subFormula, [HML.DisjFormula, HML.ConjFormula]);
            
            if (isfirst) {
                var $span = $('<span></span>').addClass('hml-subformula').attr('data-subformula-id', formula.subFormula.id);
                $span.append(formulaStr)
                result = $span[0].outerHTML;
            } else {
                result = formulaStr;
            }

            return result;
        }

        dispatchWeakForAllFormula(formula : HML.WeakForAllFormula) {
            var result;
            var isfirst = this.isFirstFormula();
            var subStr = formula.subFormula.dispatchOn(this);
            var formulaAction = "[[" + formula.actionMatcher.actionMatchingString() + "]]"
            var formulaStr = Traverse.safeHtml(formulaAction) +
                Traverse.wrapIfInstanceOf(subStr, formula.subFormula, [HML.DisjFormula, HML.ConjFormula]);

            if (isfirst) {                
                var $span = $('<span></span>').addClass('hml-subformula').attr('data-subformula-id', formula.subFormula.id);
                $span.append(formulaStr)
                result = $span[0].outerHTML;
            } else {
                result = formulaStr;
            }

            return result;
        }

        dispatchMinFixedPointFormula(formula : HML.MinFixedPointFormula) {
            var result;
            var isfirst = this.isFirstFormula();
            var subStr = formula.subFormula.dispatchOn(this);
            var formulaStr = formula.variable + " min= " + subStr;
            
            if (isfirst) {    
                var $span = $('<span></span>').addClass('hml-subformula').attr('data-subformula-id', formula.subFormula.id);
                $span.append(formulaStr)
                result = $span[0].outerHTML;
            } else {
                result = formulaStr;
            }

            return result;
        }

        dispatchMaxFixedPointFormula(formula : HML.MaxFixedPointFormula) {
            var result;
            var isfirst = this.isFirstFormula();
            var subStr = formula.subFormula.dispatchOn(this);
            var formulaStr = formula.variable + " max= " + subStr;
        
            if (isfirst) {        
                var $span = $('<span></span>').addClass('hml-subformula').attr('data-subformula-id', formula.subFormula.id);
                $span.append(formulaStr)
                result = $span[0].outerHTML;
            } else {
                result = formulaStr;
            }
        
            return result;
        }

        dispatchVariableFormula(formula : HML.VariableFormula) {
            var result;
            var isfirst = this.isFirstFormula();
            var formulaStr = Traverse.safeHtml(formula.variable);
            var namedFormulaDef = this.hmlFormulaSet.formulaByName(formula.variable);
            if (namedFormulaDef) {
                if (isfirst) {
                    // this is the first formula
                    if(namedFormulaDef instanceof HML.MinFixedPointFormula || namedFormulaDef instanceof HML.MaxFixedPointFormula) {
                        var $span = $('<span></span>').addClass('hml-subformula').attr('data-subformula-id', namedFormulaDef.subFormula.id);
                        $span.append(formulaStr)
                        result = $span[0].outerHTML;
                    }
                } else {
                    // this is not the first formula therefore just return the formula definition.
                    result = formulaStr;
                }
            } else {
                throw "HML variable " + formula.variable + " has no definition";
            }
        
            return result;
        }
    }

    class HMLSubFormulaExtractor implements HML.FormulaDispatchHandler<HML.Formula> { 
        private getForId : number;

        constructor(private hmlFormulaSet : HML.FormulaSet) {
        }

        getSubFormulaWithId(parentFormula : HML.Formula, id : number) : HML.Formula {
            this.getForId = id;
            return parentFormula.dispatchOn(this);
        }

        dispatchDisjFormula(formula : HML.DisjFormula) {
            return ArrayUtil.first(formula.subFormulas, f => f.id === this.getForId);
        }

        dispatchConjFormula(formula : HML.ConjFormula) {
            return ArrayUtil.first(formula.subFormulas, f => f.id === this.getForId);
        }

        dispatchTrueFormula(formula : HML.TrueFormula) {
            return null;
        }

        dispatchFalseFormula(formula : HML.FalseFormula) {
            return null;
        }

        dispatchStrongExistsFormula(formula : HML.StrongExistsFormula) {
            return (formula.subFormula.id === this.getForId) ? formula.subFormula : null;
        }

        dispatchStrongForAllFormula(formula : HML.StrongForAllFormula) {
            return (formula.subFormula.id === this.getForId) ? formula.subFormula : null;
        }

        dispatchWeakExistsFormula(formula : HML.WeakExistsFormula) {
            return (formula.subFormula.id === this.getForId) ? formula.subFormula : null;
        }

        dispatchWeakForAllFormula(formula : HML.WeakForAllFormula) {
            return (formula.subFormula.id === this.getForId) ? formula.subFormula : null;
        }

        dispatchMinFixedPointFormula(formula : HML.MinFixedPointFormula) {
            return (formula.subFormula.id === this.getForId) ? formula.subFormula : null;
        }

        dispatchMaxFixedPointFormula(formula : HML.MaxFixedPointFormula) {
            return (formula.subFormula.id === this.getForId) ? formula.subFormula : null;
        }

        dispatchVariableFormula(formula : HML.VariableFormula) {
            var namedFormula = this.hmlFormulaSet.formulaByName(formula.variable);
            if(namedFormula instanceof HML.MinFixedPointFormula || namedFormula instanceof HML.MaxFixedPointFormula) {
                if (namedFormula && namedFormula.subFormula.id === this.getForId) {
                    return namedFormula.subFormula;
                }
            }

            return null; 
        }

    }
}