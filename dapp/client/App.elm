module App exposing (..)

import Html exposing (Html, div, text, program)


-- MODEL

type alias Model = String

init : (Model, Cmd Message)
init = ("Hello", Cmd.none)


-- MESSAGES

type Message = NoOp


-- VIEW

view: Model -> Html Message
view model = div [] [ text model ]


-- UPDATE

update: Message -> Model -> (Model, Cmd Message)
update message model =
    case message of
        NoOp -> (model, Cmd.none)


-- SUBSCRIPTIONS

subscriptions: Model -> Sub Message
subscriptions model = Sub.none


-- MAIN

main: Program Never Model Message
main =
    program {
        init = init,
        view = view,
        update = update,
        subscriptions = subscriptions
    }
