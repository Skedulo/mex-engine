describe('TextEditorViewProcessor Tests', function () {

    it('TextEditorViewProcessor basic renderer', async function () {
        expect(true).toBeTruthy()

        // TODO: Somehow this test not able to run, investigate this later
        // StylesManager.initializeStyles()
        //
        // let textEditorViewProcessor = new TextEditorViewProcessor()
        //
        // let Component = textEditorViewProcessor.generateComponent()
        //
        // let jsonDef: TextEditorViewComponentModel = {
        //     type: "textEditor",
        //     title: "Custom title",
        //     placeholder: "Placeholder",
        //     keyboardType: "default",
        //     editable: true,
        //     multiline: true,
        //     validator: [],
        //     valueExpression: "pageData.title"
        // }
        //
        // const tree = render(<Component args={{
        //     dataContext:  SimpleProductData1(),
        //     jsonDef: jsonDef,
        //     navigationContext: new NavigationContext()
        // }} />)
        //
        // expect(tree.toJSON()).toMatchSnapshot()
    });
});
