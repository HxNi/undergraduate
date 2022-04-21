(module
  (func (export "addTwo") (param i32 i32) (result i32)
    local.get 0
    local.get 1
    i32.add)
(func (export "addThree") (param i32 i32 i32) (result i32)
    local.get 0
    local.get 1
    i32.add
  	local.get 2
    i32.add
  )
(func (export "addFour") (param i32 i32 i32 i32) (result i32)
    local.get 0
    local.get 1
    i32.add
    local.get 2
    i32.add
    local.get 3
    i32.add
  )
)