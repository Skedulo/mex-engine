import {PageLevelDataContext} from "@skedulo/mex-engine-proxy";

export const SimpleProductData1 = (): PageLevelDataContext => {
    let newObjectKey = "temp-xxx";

    return {
        formData: {
            Products:
                [
                    {UID: "1", __typename: "Products"},
                    {UID: "2", __typename: "Products"}
                ]
        },
        pageData: {
            UID: newObjectKey,
            __typename: "Products",
            __isTempObject: true,
            title: "My Product",
            qty: 2,
            createdDate: "2022-01-01",
            userInfo: {
                Name: "Huy Vu",
                email: 'hieu.bui@skedulo.com',
                url: 'https://www.google.com.vn/'
            },
            users: [],
        },
        sharedData: {},
        metadata: {
            contextObjectId: "temp-object-id",
            packageId: "temp-package"
        }
    }
}

export const MockSearchDataContext = () => {
    return ({
            formData: {
                JobProducts:
                    [
                        {
                            CreatedDate: "2022-05-31T01:04:18.000Z",
                            Product: {
                                Description: "Power sore used for cutting wood with efficiency.",
                                Name: "Power Saw",
                                UID: "01t3t00000409jbAAA",
                                __typename: "Products",
                            },
                            ProductId: "01t3t00000409jbAAA",
                            ProductName: "Power Saw",
                            Qty: 67,
                            UID: "a0K3t00000Z4wfiEAB",
                            __typename: "JobProducts",
                        }, {
                        CreatedDate: "2022-05-31T01:04:18.000Z",
                        Product: {
                            Description: "Power sore used for cutting wood with efficiency.",
                            Name: "Power Saw",
                            UID: "01t3t00000409jbAAA",
                            __typename: "Products",
                        },
                        ProductId: "01t3t00000409j1AAA",
                        ProductName: "Power Saw",
                        Qty: 67,
                        UID: "a0K3t00000Z4wfiEAB",
                        __typename: "JobProducts",
                    }
                    ]
            },
            pageData: {},
            sharedData: {},
            metadata: {}
        }
    )
}
