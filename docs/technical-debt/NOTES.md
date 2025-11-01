# Observaciones detectadas durante la sesion de Smoke Testing para poder trabajar en ellas en proximas iteraciones

- la card derived product cuando se crea como Factory en la parte de DETAILS solo muestra Type: processed, pero también debería mostrar el campo "content" (sin etiqueta, solo contenido)

- el consumer despues de aceptar la transferencia del retailer, ve el token en Products, pero en Supply Chain widget se muestra el mensaje Sin Tokens. Debería verse el token en el widget y cualquier otra información que hay que añadir como relvante desde el punto de vista de un consumer (por ejemplo: compras realizadas)

- en el product linage al final en la seccion "Supply Chain Lineage" hay un problema de contraste de color, y hay que revisar bien que la informacion que aparece es correcta (balance 0/X)

- mejorar la informacion del linage no me queda demaisado claro como usuario

- en el widget hay incongruencias segun el rol, en algunos sale el boton actualizar en otros no, hay que consolidar y centralizar lo maximo posible esto para simplificar el codigo
